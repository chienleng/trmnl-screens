<script lang="ts">
	// Token cascade: neutral.css declares the full --su-* API at zero
	// specificity; brutalist.css re-skins it via [data-theme='brutalist']
	// (set on <html>); eink.css adds per-panel arms via [data-eink] set by
	// <ScreenFrame>. app.css holds the reset and base element styles.
	import '@chienleng/stratum-ui/themes/neutral.css';
	import '$lib/themes/brutalist.css';
	import '../app.css';
	import '$lib/eink.css';

	let { children } = $props();
</script>

{@render children()}
