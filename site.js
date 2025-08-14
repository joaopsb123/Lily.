const express = require('express');
const session = require('express-session');
const passport = require('passport');
const Strategy = require('passport-discord').Strategy;
const path = require('path');
const fetch = require('node-fetch');
require('dotenv').config({ path: '.env.site' });

passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((obj, done) => done(null, obj));

passport.use(new Strategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: process.env.REDIRECT_URI,
    scope: ['identify', 'guilds']
}, (accessToken, refreshToken, profile, done) => {
    return done(null, profile);
}));

const app = express();
app.use(session({ secret: 'segredo', resave: false, saveUninitialized: false }));
app.use(passport.initialize());
app.use(passport.session());

app.use(express.static(__dirname));
app.use(express.json());

// Login
app.get('/login', passport.authenticate('discord'));
app.get('/callback', passport.authenticate('discord', { failureRedirect: '/' }), (req, res) => {
    res.redirect('/dashboard.html');
});

// Enviar mensagem pelo bot
app.post('/api/send-message', async (req, res) => {
    const { channelId, message } = req.body;
    const resp = await fetch('http://localhost:4000/send-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ channelId, message })
    });
    const data = await resp.json();
    res.json(data);
});

app.listen(process.env.PORT, () => console.log(`🌍 Site rodando em http://localhost:${process.env.PORT}`));
