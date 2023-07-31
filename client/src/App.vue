<script setup>
</script>

<template>
  <h1 class="center-h"><a href="/">Qim.link</a></h1>
  
  <!-- <router-view /> -->
  <router-view v-slot="{ Component }">
    <transition name="fade" mode="out-in">
      <component :is="Component" />
    </transition>
  </router-view>
</template>
<style>
/* GLOBAL */
.center-h {
  text-align: center;
}

.wrapper-main {
  /*
  the same but expanded 
  max-width: 840px;
  margin: 0 auto;
  padding: 0 15px; 
  */
  width: min(100% - 15px, 1200px);
  margin-inline: auto;

}
.wrapper-FileUpload {
  border: 1px solid rgb(238, 238, 238);
}
</style>
<style scoped>
  a {
    text-decoration: none;
    color: black;
  }
  /* Transition learned from this video
     https://www.youtube.com/watch?v=L77Uq93XXzk&t=305s */
  .fade-enter-from,
  .fade-leave-to {
    opacity: 0;
  }
  .fade-enter-active,
  .fade-leave-active {
    transition: opacity 0.5s ease-out;
  }
</style>
