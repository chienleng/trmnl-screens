<script lang="ts">
	import Columns from '$lib/components/charts/Columns.svelte';
	import Sparkline from '$lib/components/charts/Sparkline.svelte';
	import { devices } from '$lib/screens';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const spec = $derived(devices[data.device]);
	const scale = $derived(spec.scale);

	// Chart widths are the frame's content box: panel width less ScreenFrame's
	// --sp-3 padding (8px × scale) on each side. Heights are given in OG design
	// units and multiplied up, so the X gets genuinely taller panels rather
	// than a scaled copy of the OG's.
	const contentWidth = $derived(spec.width - 16 * scale);
	const isX = $derived(data.device === 'x');
	const tempHeight = $derived((isX ? 132 : 96) * scale);
	const rainHeight = $derived((isX ? 104 : 80) * scale);
</script>

{#if data.weather}
	{@const w = data.weather}
	<div class="screen-head label">
		<span>{w.location}</span>
		<span>{w.dateLabel}</span>
	</div>
	<div class="rule"></div>

	<div class="now">
		<div>
			<div class="value--hero">{w.temp}&deg;</div>
			<div class="title--lg cond">{w.conditions}</div>
		</div>
		<div class="rain-block">
			<div class="value--xl">{w.rainPeak}%</div>
			<div class="label">
				{w.rainPeakAt ? `Peak rain ${w.rainPeakAt}` : 'No rain due'}
			</div>
		</div>
	</div>

	<div class="metrics" class:metrics--six={isX}>
		<div>
			<div class="label">Feels</div>
			<div class="value">{w.feelsLike}&deg;</div>
		</div>
		<div>
			<div class="label">Wind</div>
			<div class="value">{w.windDir} {w.windSpeed}<span class="value--unit">km/h</span></div>
		</div>
		<div>
			<div class="label">Humidity</div>
			<div class="value">{w.humidity}%</div>
		</div>
		<div>
			<div class="label">UV</div>
			<div class="value">{w.uvMax}</div>
		</div>
		{#if isX}
			<div>
				<div class="label">Sunrise</div>
				<div class="value">{w.sunrise}</div>
			</div>
			<div>
				<div class="label">Sunset</div>
				<div class="value">{w.sunset}</div>
			</div>
		{:else}
			<div>
				<div class="label">Daylight</div>
				<div class="value value--daylight">{w.sunrise}&ndash;{w.sunset}</div>
			</div>
		{/if}
	</div>

	<div class="panel">
		<div class="panel-head label">
			<span>Temperature &mdash; next 24 h</span>
			<span>{w.tempMin}&deg; to {w.tempMax}&deg;</span>
		</div>
		<Sparkline values={w.temps} width={contentWidth} height={tempHeight} {scale} />
	</div>

	<div class="panel">
		<div class="panel-head label">
			<span>Chance of rain &mdash; next 24 h</span>
			<span>0&ndash;100%</span>
		</div>
		<Columns values={w.rain} width={contentWidth} height={rainHeight} max={100} {scale} />
		<!-- One time scale for both panels: they share an x domain, so a second
		     would be redundant ink. -->
		<div class="scale label">
			{#each w.hourTicks as tick, i (i)}
				<span>{tick}</span>
			{/each}
		</div>
	</div>

	{#if isX && w.forecast.length > 0}
		<div class="panel panel--grow">
			<div class="panel-head label"><span>Next {w.forecast.length} days</span></div>
			<div class="forecast">
				{#each w.forecast as day (day.day)}
					<div>
						<div class="title">{day.day}</div>
						<div class="value">{day.min}&ndash;{day.max}&deg;</div>
						<div class="label">{day.conditions}</div>
						<div class="label">Rain {day.rain}%</div>
					</div>
				{/each}
			</div>
		</div>
	{/if}
{:else}
	<div class="screen-head label"><span>Weather</span><span>Unavailable</span></div>
	<div class="rule"></div>
	<div class="title--lg err">No data</div>
	<div class="label">{data.error}</div>
{/if}

<style>
	.now {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		margin-top: var(--sp-3);
	}

	.cond {
		margin-top: var(--sp-2);
	}

	.rain-block {
		text-align: right;
	}

	.rain-block .label {
		margin-top: var(--sp-2);
	}

	.metrics {
		grid-template-columns: repeat(5, 1fr);
		margin-top: var(--sp-3);
	}

	.metrics--six {
		grid-template-columns: repeat(6, 1fr);
	}

	/* The OG squeezes sunrise and sunset into one cell, so it needs the smaller
	   face to stay on one line; the X gives them a cell each. */
	.value--daylight {
		font-family: 'TRMNL12', monospace;
		font-size: var(--t-12);
		line-height: 2.6;
	}

	.panel {
		margin-top: var(--sp-3);
	}

	.panel--grow {
		flex: 1;
	}

	.scale {
		display: flex;
		justify-content: space-between;
		margin-top: var(--sp-1);
	}

	.forecast {
		display: grid;
		grid-template-columns: repeat(4, 1fr);
		gap: 0;
		margin-top: var(--sp-2);
	}

	.forecast > * + * {
		border-left: var(--rule-thin) solid #000;
		padding-left: var(--sp-4);
	}

	.forecast .value {
		margin-block: var(--sp-1);
	}

	.err {
		margin-top: var(--sp-6);
	}
</style>
