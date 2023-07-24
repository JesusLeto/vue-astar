<script setup lang="ts">
import { ref, watchEffect } from "vue"

const props = defineProps<{
  imgName: string
}>()

const imgPath = ref()

watchEffect(async () => {
	imgPath.value = (await import(/* @vite-ignore */ `@a/img/${props.imgName}.png`)).default
})


</script>

<template>
    <div class="a-img">
        <img 
            draggable="false"
            :src="imgPath"
    />
    </div>
</template>

<style scoped lang="scss">
.a-img {
    @include flex-center;
    width: 100%;
    height: 100%;

    img {
        width: 24px; 
        height: 24px;
    }
}

</style>
