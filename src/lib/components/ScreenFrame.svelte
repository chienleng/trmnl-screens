<script lang="ts">
	import type { Snippet } from 'svelte';
	import { devices, type DeviceSlug } from '$lib/screens';

	let { device, children }: { device: DeviceSlug; children: Snippet } = $props();

	const spec = $derived(devices[device]);
	// The X is 1872×1404 at 227 PPI — roughly double the OG's pixel density.
	// Designing at half size and letting `zoom` double everything keeps rem-based
	// stratum-ui tokens at a comfortable physical size on both panels.
	const zoom = $derived(device === 'x' ? 2 : 1);
</script>

<div
	class="frame"
	data-eink={spec.eink}
	style:width="{spec.width / zoom}px"
	style:height="{spec.height / zoom}px"
	style:zoom
>
	{@render children()}
</div>

<style>
	.frame {
		overflow: hidden;
		display: flex;
		flex-direction: column;
		padding: var(--su-space-5);
		color: var(--su-text);
		background: var(--su-surface);
	}
</style>
