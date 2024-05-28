import { getStorage, ref, uploadBytesResumable, getDownloadURL } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-storage.js';
import {app} from "./initializeFirebase.js";


const storage = getStorage(app);


function UploadFile(file) {
    // Upload file and metadata to the object 'images/mountains.jpg'
    const storageRef = ref(storage, 'images/' + file.name);
    const uploadTask = uploadBytesResumable(storageRef, file);

    // Listen for state changes, errors, and completion of the upload.
    uploadTask.on('state_changed',
        (snapshot) => {
            // Get task progress, including the number of bytes uploaded and the total number of bytes to be uploaded
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            console.log('Upload is ' + progress + '% done');
            switch (snapshot.state) {
                case 'paused':
                    console.log('Upload is paused');
                    break;
                case 'running':
                    console.log('Upload is running');
                    break;
            }
        },
        (error) => {
            // A full list of error codes is available at
            // https://firebase.google.com/docs/storage/web/handle-errors
            switch (error.code) {
                case 'storage/unauthorized':
                    // User doesn't have permission to access the object
                    console.error("User doesn't have permission to access the object");
                    break;
                case 'storage/canceled':
                    // User canceled the upload
                    console.error("User canceled the upload");
                    break;
                case 'storage/unknown':
                    // Unknown error occurred, inspect error.serverResponse
                    console.error("Unknown error occurred, inspect error.serverResponse");
                    break;
            }
        },
        () => {
            // Upload completed successfully, now we can get the download URL
            getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
                console.log('File available at', downloadURL);
            });
        }
    );
}

function GetUrl(imgName) {
    const imgRef = ref(storage, 'images/' + imgName);

    // Get the download URL
    getDownloadURL(imgRef)
        .then((url) => {
            // return url so then I can insert url into an <img> HTML element
            return url;
        })
        .catch((error) => {
            // A full list of error codes is available at
            // https://firebase.google.com/docs/storage/web/handle-errors
            switch (error.code) {
                case 'storage/object-not-found':
                    // File doesn't exist
                    console.error("File doesn't exist");
                    break;
                case 'storage/unauthorized':
                    // User doesn't have permission to access the object
                    console.error("User doesn't have permission to access the object");
                    break;
                case 'storage/canceled':
                    // User canceled the upload
                    console.error("User canceled the upload");
                    break;
                case 'storage/unknown':
                    // Unknown error occurred, inspect the server response
                    console.error("Unknown error occurred, inspect the server response");
                    break;
            }
        });
}