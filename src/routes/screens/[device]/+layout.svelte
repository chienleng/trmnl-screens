<script lang="ts">
	import ScreenFrame from '$lib/components/ScreenFrame.svelte';

	let { data, children } = $props();
</script>

<ScreenFrame device={data.device}>
	{@render children()}
</ScreenFrame>
