<script lang="ts">
	import { Table } from '@chienleng/stratum-ui/ui';
	import ScreenHeader from '$lib/components/ScreenHeader.svelte';
	import { LOCATION } from '$lib/config';
	import { weatherLabel } from '$lib/weather';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const now = $derived(new Date(data.now));
	const dateFormat = new Intl.DateTimeFormat('en-AU', {
		weekday: 'long',
		day: 'numeric',
		month: 'long',
		timeZone: LOCATION.timeZone
	});
	const timeFormat = new Intl.DateTimeFormat('en-AU', {
		hour: 'numeric',
		minute: '2-digit',
		hourCycle: 'h23',
		timeZone: LOCATION.timeZone
	});
	const dayFormat = new Intl.DateTimeFormat('en-AU', {
		weekday: 'short',
		timeZone: LOCATION.timeZone
	});

	// Placeholder agenda/tasks — swapped for a real calendar integration later.
	const agenda = [
		{ time: '09:00', label: 'Deep work block' },
		{ time: '12:30', label: 'Lunch walk' },
		{ time: '15:00', label: 'Project review' },
		{ time: '18:00', label: 'Gym' }
	];
	const tasks = ['Water the garden', 'Reply to strata email', 'Book dentist'];
</script>

<ScreenHeader title={dateFormat.format(now)} meta="{LOCATION.name} · {timeFormat.format(now)}" />

<div class="columns">
	<section>
		{#if data.current}
			<p class="temp">
				{Math.round(data.current.temperature_2m)}°
				<span class="conditions">{weatherLabel(data.current.weather_code)}</span>
			</p>
			<p class="feels">
				Feels {Math.round(data.current.apparent_temperature)}° · Wind
				{Math.round(data.current.wind_speed_10m)} km/h · Humidity
				{Math.round(data.current.relative_humidity_2m)}%
			</p>
		{:else}
			<p class="feels">Weather unavailable</p>
		{/if}

		<Table
			compact
			cellUtils
			caption="Four-day forecast"
			headers={[
				'Day',
				'Outlook',
				{ label: 'Min', class: 'num' },
				{ label: 'Max', class: 'num' },
				{ label: 'Rain', class: 'num' }
			]}
		>
			{#each data.forecast as day (day.date)}
				<tr>
					<td class="mono">{dayFormat.format(new Date(day.date))}</td>
					<td>{weatherLabel(day.code)}</td>
					<td class="num mono">{Math.round(day.min)}°</td>
					<td class="num mono">{Math.round(day.max)}°</td>
					<td class="num mono">{day.precipProb == null ? '—' : `${day.precipProb}%`}</td>
				</tr>
			{/each}
		</Table>
	</section>

	<section>
		<h2 class="label">Agenda</h2>
		<ul class="agenda">
			{#each agenda as item (item.time)}
				<li><span class="mono">{item.time}</span>{item.label}</li>
			{/each}
		</ul>

		<h2 class="label">Tasks</h2>
		<ul class="tasks">
			{#each tasks as task (task)}
				<li>{task}</li>
			{/each}
		</ul>
	</section>
</div>

<style>
	.columns {
		flex: 1;
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: var(--su-space-6);
		min-height: 0;
	}

	.temp {
		margin: 0;
		font-family: var(--su-font-display);
		font-size: var(--su-font-size-4xl);
		font-weight: var(--su-font-weight-semibold);
		line-height: var(--su-leading-tight);
	}

	.conditions {
		font-size: var(--su-font-size-lg);
		font-weight: var(--su-font-weight-normal);
	}

	.feels {
		margin: 0 0 var(--su-space-4);
		font-size: var(--su-font-size-sm);
		color: var(--su-text-muted);
	}

	.label {
		margin: 0 0 var(--su-space-2);
		font-family: var(--su-font-mono);
		font-size: var(--su-font-size-xs);
		font-weight: var(--su-font-weight-medium);
		letter-spacing: var(--su-tracking-widest);
		text-transform: uppercase;
	}

	.agenda + .label {
		margin-top: var(--su-space-5);
	}

	.agenda,
	.tasks {
		margin: 0;
		padding: 0;
		list-style: none;
	}

	.agenda li,
	.tasks li {
		display: flex;
		gap: var(--su-space-3);
		padding-block: var(--su-space-1);
		border-bottom: 1px solid var(--su-border-muted);
	}

	.mono {
		font-family: var(--su-font-mono);
	}

	.tasks li::before {
		content: '';
		width: 0.7em;
		height: 0.7em;
		margin-top: 0.3em;
		border: 2px solid var(--su-border);
		flex-shrink: 0;
	}
</style>
