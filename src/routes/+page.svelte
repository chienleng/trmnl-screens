<script lang="ts">
	import { screens } from '$lib/screens';

	const devices = [
		{ slug: 'og', label: 'TRMNL (800×480)' },
		{ slug: 'x', label: 'TRMNL X (1872×1404)' }
	];
</script>

<svelte:head>
	<title>TRMNL Screens</title>
</svelte:head>

<main class="index">
	<h1>TRMNL Screens</h1>
	<p class="hint">
		Screens are open in local dev; deployed they need <code>?token=&hellip;</code> (or a Bearer header)
		once per browser.
	</p>
	{#each screens as screen (screen.slug)}
		<section>
			<h2>{screen.title}</h2>
			<p>{screen.description}</p>
			<ul>
				{#each devices as device (device.slug)}
					<li><a href="/screens/{device.slug}/{screen.slug}">{device.label}</a></li>
				{/each}
			</ul>
		</section>
	{/each}
</main>

<style>
	.index {
		max-width: 40rem;
		margin-inline: auto;
		padding: var(--su-space-8) var(--su-space-6);
	}

	h1 {
		font-size: var(--su-font-size-2xl);
		margin: 0 0 var(--su-space-2);
	}

	.hint {
		color: var(--su-text-muted);
		font-size: var(--su-font-size-sm);
	}

	section {
		border-top: 1px solid var(--su-border);
		padding-block: var(--su-space-5);
	}

	h2 {
		font-size: var(--su-font-size-lg);
		margin: 0 0 var(--su-space-1);
	}

	section p {
		margin: 0 0 var(--su-space-3);
		color: var(--su-text-muted);
	}

	ul {
		display: flex;
		gap: var(--su-space-4);
		list-style: none;
		margin: 0;
		padding: 0;
	}

	li a {
		text-decoration: underline;
	}
</style>
