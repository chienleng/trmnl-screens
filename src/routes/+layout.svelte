<script lang="ts">
	// The --su-* token cascade (neutral.css, re-skinned by brutalist.css via
	// [data-theme='brutalist'] on <html>) now only dresses the human-facing
	// index page; app.css holds the reset and base element styles.
	//
	// The screens themselves use fonts.css + screen.css: self-hosted TRMNL
	// bitmap faces and the --t-*/--sp-* scale tokens they lay out against.
	// Those come last so they win inside .frame. There is deliberately no
	// per-panel colour arm any more — screen.css is pure #000/#fff by
	// construction, so there are no greys left to remap for 1-bit.
	import '@chienleng/stratum-ui/themes/neutral.css';
	import '$lib/themes/brutalist.css';
	import '../app.css';
	import '$lib/fonts.css';
	import '$lib/screen.css';

	let { children } = $props();
</script>

{@render children()}
