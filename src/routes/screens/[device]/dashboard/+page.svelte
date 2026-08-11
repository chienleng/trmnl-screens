<script lang="ts">
	import Columns from '$lib/components/charts/Columns.svelte';
	import { LOCATION } from '$lib/config';
	import { devices } from '$lib/screens';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const spec = $derived(devices[data.device]);
	const scale = $derived(spec.scale);
	const isX = $derived(data.device === 'x');

	// Placeholder agenda/tasks — swapped for a real calendar integration later.
	// The X shows the full list; the OG only has room for the first few.
	const AGENDA = [
		{ time: '09:00', label: 'Deep work block' },
		{ time: '12:30', label: 'Lunch walk' },
		{ time: '15:00', label: 'Project review' },
		{ time: '18:00', label: 'Gym' },
		{ time: '20:00', label: 'Reading' }
	];
	const TASKS = ['Water the garden', 'Reply to strata email', 'Book dentist', 'Renew rego'];

	const agenda = $derived(isX ? AGENDA : AGENDA.slice(0, 4));
	const tasks = $derived(isX ? TASKS : TASKS.slice(0, 3));
	const rainWidth = $derived((isX ? 420 : 250) * scale);
</script>

<div class="screen-head label">
	<span>{LOCATION.name}</span>
	<span>{data.timeLabel}</span>
</div>
<div class="rule"></div>

<div class="date title--lg">{data.dateLabel}</div>

{#if data.weather}
	{@const w = data.weather}
	<div class="metrics">
		<div>
			<div class="label">Now</div>
			<div class="value--lg">{w.temp}&deg;</div>
		</div>
		<div>
			<div class="label">Feels</div>
			<div class="value--lg">{w.feelsLike}&deg;</div>
		</div>
		<div>
			<div class="label">Conditions</div>
			<div class="value cond">{w.conditions}</div>
		</div>
		<div class="rain-cell">
			<div class="label">Rain &mdash; next 24 h &middot; peak {w.rainPeak}%</div>
			<Columns values={w.rain} width={rainWidth} height={28 * scale} max={100} {scale} />
		</div>
	</div>
	<!-- Credits Open-Meteo for the weather block above: their data is CC BY 4.0,
	     so the attribution is a licence condition, not decoration. It sits here
	     rather than in the screen header because only this row is their data. -->
	<div class="source label">Weather &middot; Open-Meteo &middot; {w.observedAt}</div>
{/if}

<div class="cols" class:cols--x={isX}>
	<section>
		<div class="panel-head label"><span>Agenda</span></div>
		<ul>
			{#each agenda as item (item.time)}
				<li><span class="slot">{item.time}</span>{item.label}</li>
			{/each}
		</ul>
	</section>

	<section>
		<div class="panel-head label"><span>Tasks</span></div>
		<ul>
			{#each tasks as task (task)}
				<li><span class="box"></span>{task}</li>
			{/each}
		</ul>
	</section>

	{#if isX && data.weather}
		<section>
			<div class="panel-head label"><span>Next {data.weather.forecast.length} days</span></div>
			<ul>
				{#each data.weather.forecast as day (day.day)}
					<li>
						<span class="slot">{day.day}</span>{day.min}&ndash;{day.max}&deg; &middot; {day.rain}%
					</li>
				{/each}
			</ul>
		</section>
	{/if}
</div>

<style>
	.date {
		margin-top: var(--sp-3);
	}

	.metrics {
		grid-template-columns: auto auto 1fr auto;
		gap: 0 var(--sp-4);
		margin-top: var(--sp-3);
		align-items: start;
	}

	.cond {
		font-family: 'TRMNL16', monospace;
		font-size: var(--t-16);
		line-height: 2;
		text-transform: uppercase;
	}

	.rain-cell .label {
		margin-bottom: var(--sp-1);
	}

	.source {
		margin-top: var(--sp-2);
		text-align: right;
	}

	.cols {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: var(--sp-6);
		margin-top: var(--sp-5);
		flex: 1;
		min-height: 0;
	}

	.cols--x {
		grid-template-columns: 1fr 1fr 1fr;
	}

	ul {
		margin: var(--sp-2) 0 0;
		padding: 0;
		list-style: none;
	}

	li {
		display: flex;
		align-items: baseline;
		gap: var(--sp-3);
		padding-block: var(--sp-2);
		border-bottom: var(--rule-hair) solid #000;
		font-family: 'TRMNL16', monospace;
		font-size: var(--t-16);
	}

	.slot {
		font-family: 'TRMNL12', monospace;
		font-size: var(--t-12);
		letter-spacing: 0.1em;
		flex-shrink: 0;
	}

	.box {
		width: var(--t-12);
		height: var(--t-12);
		border: var(--rule-thin) solid #000;
		flex-shrink: 0;
		align-self: center;
	}
</style>
