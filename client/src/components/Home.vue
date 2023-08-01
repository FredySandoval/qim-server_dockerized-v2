<script setup>
 import FileUploadv2 from './FileUploadv2.vue';
 import router from '../router';

 /**
  * 
  * @param {object} event, {xhr: ... , files: ... }
  * @var main_link example: work-1234
  * @description goes to the path in the xhr response
  */
 function onTemplatedUpload(event) {
  const response_status = event['xhr'].status || 400;
  const rr = JSON.parse(event['xhr'].response);
  console.log('rr', rr);
  if ( response_status == 200 ) {
    const response = JSON.parse(event['xhr'].response);
    router.push(`/${response.main_link}`);
  }
 }

</script>
<template>
<div class="wrapper-main">
  <div class="wrapper-FileUpload">
    <FileUploadv2 mode="advanced" name="client_files" url="./upload" :multiple="true" @upload="onTemplatedUpload($event)">
       <template #empty>
          <div class="">
              <h3 class="center-h">Drag and drop files to here to upload, or CTRL + V an image or text from clipboard.</h3>
          </div>
        </template>
    </FileUploadv2>
</div>
  <div class="video-wrapper">
    <div class="video-box">
      <div class="shadow-box"></div>
      <video src="../assets/loopintro.mp4" loop autoplay muted width="600"></video>
    </div>
  </div>
</div>


 </template>

<style scoped>
.video-wrapper {
  height: 600px;
  display: flex; 
  justify-content: center;
  align-items: center;
}
.video-box {
  position: relative;
   /* box-shadow: inset 0 0 10px #000000; */
}
.shadow-box {
  position: absolute;
  height: 100%;
  width: 100%;
  box-shadow: inset 0 0 10px 10px #ffffff;
  
}
</style>
