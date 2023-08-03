import express, { Express, NextFunction, Request, Response} from "express";
import fileUpload from 'express-fileupload';
import * as fs from "fs";
import path from 'path';
import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);
export const dirname = path.dirname(__filename);
import { __dirname }  from './helper.js';
// import { customAlphabet } from "nanoid";
// const nanoid = customAlphabet('0123456789abcdefghijklmnopqrstuvwxyzABCDEFHIJKLMNOPQRSTUVWXYZ', 10);
import { networkInterfaces } from 'os';
import { new_random_link } from "./utils/random-links-generator.js";

const app:Express = express();
const link:string = new_random_link();
app.use(express.json());

app.use(fileUpload({
    debug: false,
    useTempFiles: false,
    // tempFileDir: path.join(dirname, 'tmp'),
}));

const index_file = path.join(__dirname, 'collections_index', 'index.json');
try {
if (!fs.existsSync(index_file)) fs.writeFileSync(index_file, '[]');
} catch (error) {}

app.use('/images', (req:Request,res:Response,next:NextFunction)=>{
    const string = req.url.slice(1, req.url.length );
    const path_string = path.join(__dirname, 'images', string)
    fs.open(path_string, 'r', (err, fd) => {
    });
    next();
})
app.use("/images", express.static(path.join(__dirname, 'images'), { setHeaders: function(res, path) {  res.contentType("image/webp"); } }));
app.use("/", express.static(path.join(__dirname, 'public')));
app.use("/assets", express.static(path.join(__dirname, 'public/assets')));

//replace with your stuff 
app.get('/test', (req, res) => {
  res.json({
    message: "😀 😃 😄 ✨✨ Yay! It's working3... ✨✨ 👌 👌 👌"
  });
});

/**
 * @type - POST
 * @return {Object} An Object with 'mainlink' property
 * @property {string} main_link - The main link of the uploaded file
 * @example
 * // { main_link: "https://example.com/id-1234"}
 */
import upload from './routes/upload2.js';
app.use('/upload', upload);

import files from './routes/files.js'
app.use('/files', files);

import edit from './routes/edit.js';
app.use('/edit', edit);

import deleteFiles from './routes/delete.js';
app.use('/delete', deleteFiles);

import download from './routes/download.js'
app.use('/download', download);

app.post('/api', async(req:Request, res:Response)=>{
    res.json({
        mainLink: 'hola',
        dayCreated: 2,
        totalFiles: 2,
        hasTags: ['string'],
        showDeleteButton: true
    })
});

app.use('/:id', (req:Request, res:Response, next:NextFunction)=>{
    express.static(path.join(__dirname, 'public')  )(req, res, next)
});

function notFound(req:Request, res:Response, next:NextFunction) { res.status(404); const error = new Error('Not Found - ' + req.originalUrl); next(error);};
function errorHandler(err:Request,  res:Response ) { res.status(res.statusCode || 500); res.json({   message: err   })};
app.use(notFound);
app.use(errorHandler);

if (!process.env.production) {
    var interfaces = networkInterfaces(), localhostIP:string;
    for (var k in interfaces) {
        for (var k2 in interfaces[k]) {
            let ipFamily = interfaces[k][k2].family;
            if ( ipFamily === 'IPv4' || ipFamily === 'IPv6' && !interfaces[k][k2].internal) {
                localhostIP = interfaces[k][k2].address;
            }
        }
    }
}

const port = process.env.PORT || 443;
app.listen(port, () => {
    if (!process.env.production) {
        console.log(`Listening on http://${localhostIP}:${port}`);
    }
});