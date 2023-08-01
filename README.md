# QIM.link
Creating a Sharing file app
See the demo at qim.fredy.dev or check the CODE in GitHub

The problem to be solved:
I can be a real pain when you try to move pictures or files from your phone to your computer and the other way around and also share files to another person across the internet.

Project Description:
Qim.link is a fullstack project that allows users to upload files to the server and this creates a sharing link, if a picture is load the server will create a thumbnail for each picture, the service also allows the users to download all the files in a zip, or only download individual files.

Highlights of the project:
- I created the little animation in Blender.
- It uses a small database to store information.
- Show previews for the image files.
- All through HTTPS.
- Technologies used:
- Blender (Graphics)
- NodeJS (Backend)
- Vue3 (Fronend)
- LowDB (Database)


![qim](https://user-images.githubusercontent.com/45242501/214434576-bf58f1b8-8985-45b8-a795-02f6682a236f.PNG)

### Project file tree
```txt
┌── client
│   ├── public
│   └── src
│       ├── assets
│       ├── components
│       │   ├── datatable
│       │   └── Image
│       └── router
└── server
    └── src
        ├── collections_index
        ├── files
        ├── images
        ├── routes
        └── utils


```