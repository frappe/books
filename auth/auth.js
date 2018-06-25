const jwt = require("jwt-simple");
const frappe = require("frappejs");
const passport = require("passport");
const passportJWT = require("passport-jwt");
const bcrypt = require('bcrypt');
const { DateTime } = require('luxon');
const jwtSecret = require('crypto').randomBytes(256);

const ExtractJwt = passportJWT.ExtractJwt;
const Strategy = passportJWT.Strategy;

const params = {
    secretOrKey: jwtSecret,
    jwtFromRequest: ExtractJwt.fromHeader('token')
};


module.exports = () => {

    const strategy = new Strategy(params, async function (payload, done) {
        const email = payload.email;
        if (!email) return done(new Error("Invalid Request"), null)

        const user = (await frappe.db.getAll({
            doctype: 'User',
            filters: { name: email }
        }))[0];

        if (user) {
            return done(null, {
                email: user.email
            });
        } else {
            return done(new Error("User not found"), null);
        }
    });

    passport.use(strategy);

    return {
        initialize: () => {
            return passport.initialize();
        },
        authenticate: () => {
            return passport.authenticate("jwt", { session: false });
        },
        login: async function (req, res) {
            const { email, password } = req.body;

            if (!(email && password)) {
                res.status(400).send('Email and Password are required');
                return;
            }

            try {
                const user = await frappe.getDoc('User', email);
                const match = await bcrypt.compare(password, user.password);

                if (!match) {
                    throw new Error('Invalid password');
                }

                const payload = {
                    email: user.name,
                    exp: timeInSecondsAfterHr(24)
                };

                const token = jwt.encode(payload, jwtSecret);
                res.json({
                    token: token
                });
            } catch (e) {
                console.error(e);
                res.sendStatus(401);
            }
        },
        signup: async function (req, res) {
            const { email, password, fullName } = req.body;

            if (!(email && password && fullName)) {
                res.status(400).send('Need email, password and fullName to create User');
                return;
            }

            try {
                const saltRounds = 10;
                const hash = await bcrypt.hash(password, saltRounds);
                const now = DateTime.local().toISO();

                const user = frappe.newDoc({
                    doctype: 'User',
                    name: email,
                    fullName: fullName,
                    password: hash,
                    owner: email,
                    modifiedBy: email,
                    creation: now
                });
                await user.insert();

                res.json({
                    user: user.email
                });
            } catch (e) {
                console.error(e);
                res.status(500).send('Something went wrong!');
            }
        }
    };
};

function timeInSecondsAfterHr(hour = 1) {
    return Math.floor(Date.now() / 1000) + (3600 * hour)
}