<script lang="ts">
	let { title, meta = '' }: { title: string; meta?: string } = $props();
</script>

<header>
	<h1>{title}</h1>
	{#if meta}<span class="meta">{meta}</span>{/if}
</header>

<style>
	header {
		display: flex;
		align-items: baseline;
		justify-content: space-between;
		gap: var(--su-space-4);
		padding-bottom: var(--su-space-2);
		border-bottom: 3px solid var(--su-border);
		margin-bottom: var(--su-space-4);
	}

	h1 {
		margin: 0;
		font-family: var(--su-font-display);
		font-size: var(--su-font-size-xl);
		font-weight: var(--su-font-weight-semibold);
		letter-spacing: var(--su-tracking-widest);
		text-transform: uppercase;
	}

	.meta {
		font-family: var(--su-font-mono);
		font-size: var(--su-font-size-sm);
		white-space: nowrap;
	}
</style>
