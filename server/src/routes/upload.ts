import { __dirname } from '../helper.js';
import express, { Express, NextFunction, Request, Response } from "express";
import { customAlphabet } from "nanoid";
import lodash from 'lodash';
import { new_random_link } from "../utils/random-links-generator.js";
import * as fs from "fs";
import path from 'path';

import { Low } from 'lowdb';
import { JSONFile } from 'lowdb/node';

import sharp from 'sharp';

const index_file = path.join(__dirname, 'collections_index', 'index.json');
if (!fs.existsSync(index_file)) fs.writeFileSync(index_file, '[]');

class LowWithLodash<T> extends Low<T> {
  chain: lodash.ExpChain<this['data']> = lodash.chain(this).get('data')
}
const index_adapter = new JSONFile(index_file);
// const index_db = new Low(index_adapter);
const index_db = new LowWithLodash(index_adapter);


const CLIENT_FILES = 'client_files';

const nanoid = customAlphabet('0123456789abcdefghijklmnopqrstuvwxyzABCDEFHIJKLMNOPQRSTUVWXYZ', 10);
const router = express.Router();

interface MyRequest extends Request {
  files: [
    {
      name: string;
      data: Buffer;
      size: number;
      encoding: string;
      tempFilePath: string;
      truncated: boolean;
      mimetype: string;
      md5: string;
      mv: (filePath: string, callback: (err?: Error) => void) => void | Promise<void>;
    }
  ]
};

router.post('/', async (req: MyRequest, res: Response) => {
  const content_length: number = Number(req.headers['content-length'])
  if (content_length === 0 || !("files" in req)) res.status(400).send('Request body cannot be emtpy');

  const req_file_keys = Object.keys(req.files);
  if (!req_file_keys.includes(CLIENT_FILES)) return res.status(400).send('Invalid request 01');

  if (("main_link" in req.query)) { // main_link already exists and adds files to it
    await index_db.read();
    const file_post = index_db.chain.find({ main_link: req.query.main_link }).value();
    const new_file_upload = handleUploadFiles(req, res);


    file_post.documents = file_post.documents.concat(new_file_upload);
    file_post.total_files = file_post.documents.length;
    await index_db.write();

    return res.json({
      data: new_file_upload
    })
  };



  const lang: string = req.headers['accept-language'];
  const language_array = lang.split(',');
  const preferred_language = language_array[0];

  const main_link = new_random_link(preferred_language);

  const new_upload = {
    main_link: main_link,
    created_at: new Date(),
    total_files: 0,
    documents: []
  };

  //  let upload_path:string;
  //  let file_unique_name: string;
  //  let file_extension:string;
  // @ts-ignore
  // const new_file_upload = handleUploadFiles(req, res);
  let new_file_upload;
  myAsyncFunction(req).then((data)=> {
    new_file_upload = data
  })
  new_upload.documents = new_upload.documents.concat(new_file_upload);


  //  if ( Array.isArray(req.files[CLIENT_FILES]) ){
  //      for (const file of req.files[CLIENT_FILES]) {
  //          file_unique_name = nanoid();
  //          upload_path = __dirname + '/files/' + file_unique_name;
  //          file_extension = file.name.substring( file.name.lastIndexOf('.') + 1, file.name.length ) || file.name;
  //          file.mv(upload_path, function(err:any) {
  //             if ( err) return res.status(500).send(err);
  //          });
  //          const new_obj_file = {
  //            name: file.name,
  //            unique_name: file_unique_name,
  //            file_extension: file_extension,
  //            size: file.size,
  //            encoding: file.encoding,
  //            mimetype: file.mimetype,
  //            md5: file.md5
  //          }
  //          new_file_upload.documents.push(new_obj_file);
  //      };
  //  } else {
  //          file_unique_name = nanoid();
  //          upload_path = __dirname + '/files/' + file_unique_name;
  //          const file = req.files[CLIENT_FILES];

  //          const parts = file.name.split('.');
  //          // file_extension = file.name.substring( file.name.lastIndexOf('.') + 1, file.name.length ) || file.name;
  //          file_extension = parts[parts.length - 1];

  //          file.mv(upload_path, function(err:any) {
  //             if ( err) return res.status(500).send(err);
  //          });
  //          const new_obj_file = {
  //            name: file.name,
  //            unique_name: file_unique_name,
  //            file_extension: file_extension,
  //            size: file.size,
  //            encoding: file.encoding,
  //            mimetype: file.mimetype,
  //            md5: file.md5
  //          }
  //          new_file_upload.documents.push(new_obj_file);
  //  }
  await index_db.read();
  if (Array.isArray(index_db.data)) {
    new_upload.total_files = new_upload.documents.length;
    index_db.data.push(new_upload);
  }
  await index_db.write();
  res.json({ main_link: new_upload.main_link })
});

function handleUploadFiles(req: MyRequest, res: Response) {
  let upload_path: string;
  let file_unique_name: string;
  let file_extension: string;
  if (Array.isArray(req.files[CLIENT_FILES])) { // multiple files
    let return_obj = [];
    let new_obj_file: object;
    for (const file of req.files[CLIENT_FILES]) {
      file_unique_name = nanoid();
      upload_path = __dirname + '/files/' + file_unique_name;
      file_extension = file.name.substring(file.name.lastIndexOf('.') + 1, file.name.length) || file.name;
      file.mv(upload_path).then((err) => {
        if (err) return res.status(500).send(err);
      });
      new_obj_file = {
        name: file.name,
        unique_name: file_unique_name,
        file_extension: file_extension,
        size: file.size,
        encoding: file.encoding,
        mimetype: file.mimetype,
        md5: file.md5
      };
      // const image_pattern = /^image\/(jpeg|jpg|png|gif|webp|avif|tiff|svg)$/;
      // if ( image_pattern.test(file.mimetype)) {
      //   fs.symlinkSync(upload_path, __dirname + '/images/' + file_unique_name);
      //   console.log('checkexists', fs.existsSync(upload_path));
      //   sharp(upload_path)
      //     .resize(50,50)
      //     .webp()
      //     .toFile(`${__dirname}/images/${file_unique_name}_small`, (err, info)=>{
      //       console.log('err', err);
      //       console.log('info', info);
      //     })
      // }

      return_obj.push(new_obj_file)
    };
    for (const file of return_obj) {
      const image_pattern = /^image\/(jpeg|jpg|png|gif|webp|avif|tiff|svg)$/;
      if (image_pattern.test(file.mimetype)) {
        upload_path = __dirname + '/files/' + file.unique_name;
        fs.symlinkSync(upload_path, __dirname + '/images/' + file.unique_name);
        sharp(upload_path)
          .resize(50, 50)
          .webp()
          .toFile(`${__dirname}/images/${file_unique_name}_small`, (err, info) => {
            console.log('err', err);
            console.log('info', info);
          });
      }
    }
    return return_obj;
  } else {
    file_unique_name = nanoid();
    upload_path = __dirname + '/files/' + file_unique_name;
    const file = req.files[CLIENT_FILES];

    const parts = file.name.split('.');
    // file_extension = file.name.substring( file.name.lastIndexOf('.') + 1, file.name.length ) || file.name;
    file_extension = parts[parts.length - 1];

    file.mv(upload_path, function (err: any) {
      if (err) return res.status(500).send(err);
    });
    const new_obj_file = {
      name: file.name,
      unique_name: file_unique_name,
      file_extension: file_extension,
      size: file.size,
      encoding: file.encoding,
      mimetype: file.mimetype,
      md5: file.md5
    }
    const image_pattern = /^image\/(jpeg|jpg|png|gif|webp|avif|tiff|svg)$/;
    if (image_pattern.test(file.mimetype)) {
      // fs.symlinkSync(upload_path, __dirname + '/images/' + file_unique_name);
      sharp(upload_path)
        .resize(50, 50)
        .webp()
        .toFile(`${__dirname}/images/${file_unique_name}_small`, (err, info) => { })
    }
    return new_obj_file;
    // new_file_upload.documents.push(new_obj_file);
  }
}

function myAsyncFunction(req) {
  return new Promise((resolve, reject) => {
    let upload_path: string;
    let file_unique_name: string;
    let file_extension: string;
    if (Array.isArray(req.files[CLIENT_FILES])) { // multiple files
      let total_files = req.files[CLIENT_FILES].length
      let total_counter = 0;
      let return_obj = [];
      let new_obj_file: object;
      for (const file of req.files[CLIENT_FILES]) {
        file_unique_name = nanoid();
        upload_path = __dirname + '/files/' + file_unique_name;
        file_extension = file.name.substring(file.name.lastIndexOf('.') + 1, file.name.length) || file.name;

        new_obj_file = {
          name: file.name,
          unique_name: file_unique_name,
          file_extension: file_extension,
          size: file.size,
          encoding: file.encoding,
          mimetype: file.mimetype,
          md5: file.md5
        };

        file.mv(upload_path).then((err) => {
          if (err) return console.log('err', err);
          return_obj.push(new_obj_file)
          total_counter += 1;
          if ( total_counter == total_files ) {
            resolve(return_obj)
          }
        });
      }
    }
  });
}

export default router;