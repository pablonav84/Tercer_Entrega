import { fileURLToPath } from 'url';
import { dirname } from 'path';
import bcrypt from "bcrypt"
import passport from "passport"
import multer from "multer"

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default __dirname;

export const SECRET="CoderCoder123"

export const generaHash=password=>bcrypt.hashSync(password, bcrypt.genSaltSync(10))

export const passportCall=(estrategia)=>{
    return function(req, res, next) {
        passport.authenticate(estrategia, function(err, user, info, status) {
          if (err) { return next(err) }
          if (!user) {
            res.setHeader('Content-Type','application/json');
            return res.status(401).json({
                error: info.message?info.message:info.toString()
            })
          }
        req.user=user
        return next()
        })(req, res, next);
      }
}

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, './src/uploads')
    },
    filename: function (req, file, cb) {
      cb(null, file.originalname)
    }
  })

export const upload = multer({ storage: storage })