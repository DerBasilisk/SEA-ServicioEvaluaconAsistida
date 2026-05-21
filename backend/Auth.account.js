const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const DiscordStrategy = require("passport-discord").Strategy;
const User = require("./models/user");

// --- ESTRATEGIA GOOGLE ---
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const userEmail = profile.emails?.[0]?.value;

        // 1. Buscar usuario existente por GoogleID o Email
        let user = await User.findOne({
          $or: [
            { googleId: profile.id },
            { email: userEmail },
          ],
        });

        if (user) {
          let modified = false;
          // Vincular cuenta si el email coincide pero no tenía googleId
          if (!user.googleId) {
            user.googleId = profile.id;
            modified = true;
          }
          // Actualizar avatar si no tiene uno
          if (!user.avatar && profile.photos?.[0]?.value) {
            user.avatar = profile.photos[0].value.replace("=s96-c", "=s400-c");
            modified = true;
          }
          
          if (modified) await user.save();
          return done(null, user);
        }

        // 2. Si no existe, crear usuario nuevo
        const newUser = await User.create({
          googleId: profile.id,
          username: profile.displayName
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/[^a-zA-Z0-9]/g, "")
            .toLowerCase()
            .slice(0, 12) + "_" + Math.floor(1000 + Math.random() * 9000), // Random 4 dígitos más limpio
          email: userEmail,
          password: Math.random().toString(36).slice(-10), // Password random más corto
          avatar: profile.photos?.[0]?.value?.replace("=s96-c", "=s400-c") || null,
          emailVerified: true,
        });

        return done(null, newUser);
      } catch (err) {
        console.error("❌ Error en GoogleStrategy:", err);
        return done(err, null);
      }
    }
  )
);

// --- ESTRATEGIA DISCORD ---
passport.use(
  new DiscordStrategy(
    {
      clientID: process.env.DISCORD_CLIENT_ID,
      clientSecret: process.env.DISCORD_CLIENT_SECRET,
      callbackURL: process.env.DISCORD_CALLBACK_URL,
      scope: ["identify", "email"],
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        let user = await User.findOne({
          $or: [
            { discordId: profile.id },
            { email: profile.email },
          ],
        });

        if (user) {
          if (!user.discordId) {
            user.discordId = profile.id;
            await user.save();
          }
          return done(null, user);
        }

        const avatar = profile.avatar
          ? `https://cdn.discordapp.com/avatars/${profile.id}/${profile.avatar}.png`
          : null;

        const newUser = await User.create({
          discordId: profile.id,
          username: profile.username.replace(/[^a-zA-Z0-9]/g, "").toLowerCase().slice(0, 12) + "_" + Math.floor(1000 + Math.random() * 9000),
          email: profile.email,
          password: Math.random().toString(36).slice(-10),
          avatar,
          emailVerified: true,
        });

        return done(null, newUser);
      } catch (err) {
        console.error("❌ Error en DiscordStrategy:", err);
        return done(err, null);
      }
    }
  )
);

module.exports = passport;