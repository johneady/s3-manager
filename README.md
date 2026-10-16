# S3 Manager

A lightweight, browser-based file manager for S3-compatible object storage. It is plain HTML, CSS, and JavaScript, so there is no build step, no server-side code, and no dependencies to install. It talks to your storage provider directly from the browser using the [AWS SDK for JavaScript](https://github.com/aws/aws-sdk-js).

Works with any S3-compatible service, including IDrive e2, Garage, MinIO, Wasabi, Backblaze B2, Cloudflare R2, and AWS S3.

## Features

- **Multiple providers:** define several S3 accounts and switch between them from a dropdown
- **Buckets:** list, create, and delete (empty) buckets, with per-bucket size totals
- **Browsing:** navigate folders with breadcrumbs, and sort by name, size, or last modified
- **Uploads:** upload multiple files at once by drag and drop or file picker
- **Downloads:** download files through short-lived (5-minute) pre-signed URLs
- **Deletes:** delete single files, multiple selected files, or whole folders
- **Folders:** create new folders
- **Storage usage:** a header bar shows total storage used across all buckets

## Getting started

1. Clone the repository:

   ```sh
   git clone https://github.com/johneady/s3-manager.git
   cd s3-manager
   ```

2. Create your local credentials file from the example:

   ```sh
   cp js/managers.local.example.js js/managers.local.js
   ```

3. Edit `js/managers.local.js` and add one entry per S3 account:

   ```js
   var S3_MANAGERS = [
     {
       id:        'main',               // unique identifier
       name:      'My S3 Provider',     // label shown in the dropdown
       accessKey: 'YOUR_ACCESS_KEY_ID',
       secretKey: 'YOUR_SECRET_ACCESS_KEY',
       endpoint:  'https://s3.example.com',
       region:    'us-east-1'
     }
   ];
   ```

4. Open `s3manager.html` in your browser. You can open the file directly or serve the folder with any static web server, for example:

   ```sh
   php -S localhost:8000
   # then visit http://localhost:8000/s3manager.html
   ```

### Changing credentials in the browser

The **⚙ Settings** button lets you override the active provider's credentials without editing files. Overrides are saved in the browser's `localStorage`. **Reset to defaults** discards them and goes back to the values in `managers.local.js`.

## CORS configuration

Because requests come straight from the browser, your storage provider must allow cross-origin requests from wherever you open the app. If buckets fail to load or uploads fail with network errors, add a CORS rule to your buckets. A permissive example:

```json
[
  {
    "AllowedOrigins": ["http://localhost:8000"],
    "AllowedMethods": ["GET", "PUT", "POST", "DELETE", "HEAD"],
    "AllowedHeaders": ["*"],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3000
  }
]
```

How you apply CORS rules depends on your provider; check its documentation.

## Security

This app runs entirely in the browser, so your access keys are loaded into the page and can be read by anyone who can open it.

- `js/managers.local.js` is listed in `.gitignore`. **Never commit it.**
- Use it locally, or behind authentication. **Do not host it on a public web server** with real credentials.
- Where your provider supports it, use access keys scoped to only the buckets and permissions you need.
- Credentials saved through the Settings dialog are stored unencrypted in `localStorage`.

## Project structure

```
s3manager.html                 Main page
css/
  base.css                     Base styles and form elements
  layout.css                   Header, sidebar, and main layout
  file-table.css               File listing table
  modals.css                   Dialogs
  components.css               Buttons, toasts, spinners
js/
  managers.local.example.js    Template for your credentials file
  managers.local.js            Your credentials (gitignored)
  config.js                    Provider selection and Settings dialog
  buckets.js                   Bucket list, sizes, create and delete
  file-list.js                 Folder browsing and sorting
  file-actions.js              Download, delete, and new folder
  upload.js                    Upload dialog and drag and drop
  ui.js                        Modals, toasts, and status helpers
  utils.js                     Formatting and escaping helpers
  main.js                      Startup and global event handlers
```

## Limitations

- The storage usage bar assumes a 1 TB quota (`TB` in `js/buckets.js`).
- Bucket and folder sizes are calculated by listing every object, which can be slow for very large buckets.
- Uploads use single `PutObject` requests rather than multipart uploads, so very large files may hit provider limits.
