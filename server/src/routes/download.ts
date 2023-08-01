import express, { Express, NextFunction, Request, Response } from "express";
const router = express.Router();

import * as fs from "fs";

import { __dirname }  from '../helper.js';
import path from 'path';

import lodash from 'lodash';
import { Low } from 'lowdb';
import { JSONFile } from 'lowdb/node';

//@ts-ignore
import async from 'async';
import zipstream from 'zip-stream';
// import async from 'async/lib/async.js'
// import zipstream from 'zip-stream/index.js'
// var response = express.response;
// exports.options = { level: 1 };
//@ts-ignore

// response.zip = function(files, filename, cb) {
//   if (typeof filename === 'function') {
//     cb = filename;
//     filename = undefined;
//   }
//   if (typeof filename === 'undefined') {
//     filename = "attachment.zip";
//   }
//   cb = cb || function() {};
//   this.header('Content-Type', 'application/zip');
//   this.header('Content-Disposition', 'attachment; filename="' + filename + '"');
//   var zip = zipstream({ level: 1});
//   zip.pipe(this);
//   var addFile = function(file, cb) {
//     zip.entry(fs.createReadStream(file.path), { name: file.name }, cb);
//   };
//   async.forEachSeries(files, addFile, function(err) {
//     if (err) return cb(err);
//     zip.finalize();
//     cb(null, zip.getBytesWritten());
//   });
// }


class LowWithLodash<T> extends Low<T> {
    chain: lodash.ExpChain<this['data']> = lodash.chain(this).get('data')
}

const index_file = path.join(__dirname, 'collections_index', 'index.json');

const index_adapter = new JSONFile(index_file);
const index_db = new LowWithLodash(index_adapter);

router.post('/', async (req:Request, res:Response)=>{
  // @ts-ignore
  
  if ( !Array.isArray(req.body)) return res.status(400).send('invalid json');

   if ( req.body.length == 1) {
      const unique_name = req.body[0].unique_name;
      const file_path = path.join(__dirname, 'files', unique_name)
      const does_file_exist = fs.existsSync(file_path);
      if (! does_file_exist ) return res.status(400).send('file doesn exists!');
      const original_name = req.body[0].name
      return res.status(200).download(file_path, original_name);
   }
   const array_of_files = [];
   for (const file of req.body) {
    const unique_name = file.unique_name;
    const name = file.name;
    const file_path = path.join(__dirname, 'files', unique_name);
    const does_file_exist = fs.existsSync(file_path);
    if (! does_file_exist ) return res.status(400).send('file doesn exists!');
    array_of_files.push({ path: file_path, name: name });
   }

   //  @ts-ignore
  res.zip = function(files:[], zipname:string) {
    this.header('Content-Type', 'application/zip');
    this.header('Content-Disposition', 'attachment; filename="' + zipname + '"');
    var zip = zipstream({ level: 1});
    zip.pipe(this); // res is a writable stream
    var addFile = function(file:any, cb:any) {
      zip.entry(fs.createReadStream(file.path), { name: file.name }, cb);
    };
    async.forEachSeries(files, addFile, function(err:any) {
      if (err) return;
      zip.finalize();
    }); 
   }
   //@ts-ignore
   res.zip(array_of_files, 'Attachment.zip');
});

export default router;