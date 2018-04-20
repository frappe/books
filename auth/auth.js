const jwt = require("jwt-simple");
const frappe = require("frappejs");
const passport = require("passport");
const passportJWT = require("passport-jwt");
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
            if (req.body.email && req.body.password) {
                const name = req.body.email || req.body.name;
                const password = req.body.password;

                const user = (await frappe.db.getAll({
                    doctype: 'User',
                    filters: { password, name }
                }))[0];

                if (user) {
                    const payload = {
                        email: user.name,
                        exp: timeInSecondsAfterHr(24)
                    };
                    const token = jwt.encode(payload, jwtSecret);
                    res.json({
                        token: token
                    });
                } else {
                    res.sendStatus(401);
                }

            } else {
                res.sendStatus(401);
            }
        }
    };
};

function timeInSecondsAfterHr(hour=1) {
    return Math.floor(Date.now() / 1000) + (3600 * hour)
}