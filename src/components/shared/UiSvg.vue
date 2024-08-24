<script lang="ts" setup>

const props = withDefaults(defineProps<{
  prefix?: string,
  name?: string,
  color?: string,
  size?: "big" | "medium" | "small" | "xsmall" | ""
}>(), {
	prefix: "icon",
	name: "",
	color: "#171717",
	size: "big"
})

const symbolId = () => `#${props.prefix}-${props.name}`
</script>

<template>
  <svg aria-hidden="true" class="ui-svg" :class="`ui-svg_${size}`">
    <use :href="symbolId()" :fill="color" />
  </svg>
</template>

<style scoped lang="scss">
.ui-svg {
  @each $size, $height in
          (big, 32px),
          (medium, 20px),
          (small, 16px),
          (xsmall, 12px){
    &#{'_' + $size} {
      height: $height;
      width: $height;
    }
  }
}
</style>
