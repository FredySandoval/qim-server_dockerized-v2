import express, { Express, NextFunction, Request, Response } from "express";
import { customAlphabet } from "nanoid";
import sharp from 'sharp';
import * as fs from "fs";
import path from 'path';

import { new_random_link } from "../utils/random-links-generator.js";
import { __dirname } from '../helper.js';

const CLIENT_FILES = 'client_files';

const nanoid = customAlphabet('0123456789abcdefghijklmnopqrstuvwxyzABCDEFHIJKLMNOPQRSTUVWXYZ', 10);
const router = express.Router();

// lodash
import lodash from 'lodash';
import { Low } from 'lowdb';
import { JSONFile } from 'lowdb/node';

const index_file = path.join(__dirname, 'collections_index', 'index.json');
try {
if (!fs.existsSync(index_file)) fs.writeFileSync(index_file, '[]');
} catch (error) {}

class LowWithLodash<T> extends Low<T> {
  chain: lodash.ExpChain<this['data']> = lodash.chain(this).get('data')
}
const index_adapter = new JSONFile(index_file);
const index_db = new LowWithLodash(index_adapter);
// end lodash


router.post('/', async (req: Request, res: Response) => {



  // @ts-ignore
  if (!Array.isArray(req.files[CLIENT_FILES])) req.files[CLIENT_FILES] = [req.files[CLIENT_FILES]];
  let new_documents = [];
  // @ts-ignore
  for (const file of req.files[CLIENT_FILES]) {
    let create_unique_name = nanoid();
    let upload_path = __dirname + '/files/' + create_unique_name;
    let image_path = __dirname + '/images/' + create_unique_name;
    let file_extension = file.name.substring(file.name.lastIndexOf('.') + 1, file.name.length) || file.name;

    file.mv(upload_path, async function (err) {
      if (err)
        return res.status(500).send(err);
      const image_pattern = /^image\/(jpeg|jpg|png|gif|webp|avif|tiff|svg)$/;
      if (image_pattern.test(file.mimetype)) {
        fs.symlinkSync(upload_path, image_path)
        
        await sharp(upload_path)
          .resize(50, 50)
          .webp()
          .toFile(`${image_path}_small`, (err, info) => { })
      }
    });

    let new_obj_file = {
      name: file.name,
      unique_name: create_unique_name,
      file_extension: file_extension,
      size: file.size,
      encoding: file.encoding,
      mimetype: file.mimetype,
      md5: file.md5
    };
    new_documents.push(new_obj_file);
  }

  if (("main_link" in req.query)) { // main_link already exists and adds files to it
    await index_db.read();
    const file_post = index_db.chain.find({ main_link: req.query.main_link }).value();
    file_post.documents = file_post.documents.concat(new_documents);
    await index_db.write();
    
    return res.json({
      data: new_documents 
    })
  } else {
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
    new_upload.documents = new_upload.documents.concat(new_documents);
    await index_db.read();
    if (Array.isArray(index_db.data)) {
      index_db.data.push(new_upload);
    }
    await index_db.write();
    res.json({ main_link: new_upload.main_link })
  }
});

export default router;

/**
1. Import necessary modules and classes such as express, nanoid, sharp, fs, path, lodash, and Low.
2. Define constant CLIENT_FILES and set up nanoid custom alphabet.
3. Define and initialize the Express router.
4. Load or create a JSON index file for the database.
5. Define class LowWithLodash that extends Low, integrating lodash chaining.
6. Define a POST route on the router:
   a. Check if req.files[CLIENT_FILES] is an array, if not convert to an array.
   b. Initialize an empty array new_documents for new uploaded files.
   c. Iterate through the files:
      i. Create a unique name and upload path.
      ii. Move the file to the upload path.
      iii. Check if the file is an image and process it with sharp, resizing and converting to webp format.
      iv. Create an object with file details and push it to new_documents array.
   d. Check if "main_link" exists in the query:
      i. If it does, find the corresponding post and add the new documents to it.
      ii. Respond with the new documents' data.
      iii. If "main_link" does not exist, create a new upload entry with a random link, file details, etc.
      iv. Add the new upload entry to the database.
      v. Respond with the main link of the new upload.
7. Export the router.
*/