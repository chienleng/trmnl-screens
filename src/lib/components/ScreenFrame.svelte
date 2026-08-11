<script lang="ts">
	import type { Snippet } from 'svelte';
	import { devices, type DeviceSlug } from '$lib/screens';

	let { device, children }: { device: DeviceSlug; children: Snippet } = $props();

	const spec = $derived(devices[device]);
</script>

<!--
	Exact panel pixels, no `zoom`. The previous version designed the X at half
	size and doubled it, which forced both panels to share one layout; here
	`--scale` multiplies type and rules only, so the X's extra room is real
	space a screen can lay out into differently.
-->
<div
	class="frame"
	data-eink={spec.eink}
	style:width="{spec.width}px"
	style:height="{spec.height}px"
	style:--scale={spec.scale}
>
	{@render children()}
</div>

<style>
	.frame {
		overflow: hidden;
		display: flex;
		flex-direction: column;
		padding: var(--sp-3);
	}
</style>
