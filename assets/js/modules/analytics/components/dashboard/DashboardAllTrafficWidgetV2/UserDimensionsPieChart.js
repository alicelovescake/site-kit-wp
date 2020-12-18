/**
 * UserDimensionsPieChart component
 *
 * Site Kit by Google, Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * External dependencies
 */
import PropTypes from 'prop-types';
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { useCallback, useState } from '@wordpress/element';
import { __, _n, _x, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import { STORE_NAME as CORE_SITE } from '../../../../../googlesitekit/datastore/site/constants';
import { STORE_NAME as CORE_USER } from '../../../../../googlesitekit/datastore/user/constants';
import { STORE_NAME } from '../../../datastore/constants';
import { numberFormat, sanitizeHTML } from '../../../../../util';
import { extractAnalyticsDataForPieChart } from '../../../util';
import GoogleChart from '../../../../../components/GoogleChart';
import PreviewBlock from '../../../../../components/PreviewBlock';
import ReportError from '../../../../../components/ReportError';
const { useSelect } = Data;

export default function UserDimensionsPieChart( { dimensionName } ) {
	const [ chartLoaded, setChartLoaded ] = useState( false );

	const url = useSelect( ( select ) => select( CORE_SITE ).getCurrentEntityURL() );
	const dateRangeDates = useSelect( ( select ) => select( CORE_USER ).getDateRangeDates( { compare: true } ) );

	const args = {
		...dateRangeDates,
		metrics: [ { expression: 'ga:users' } ],
		dimensions: [ dimensionName ],
		orderby: {
			fieldName: 'ga:users',
			sortOrder: 'DESCENDING',
		},
		limit: 4,
	};

	if ( url ) {
		args.url = url;
	}

	const onReady = useCallback( () => {
		setChartLoaded( true );
	}, [] );

	const loaded = useSelect( ( select ) => select( STORE_NAME ).hasFinishedResolution( 'getReport', [ args ] ) );
	const error = useSelect( ( select ) => select( STORE_NAME ).getErrorForSelector( 'getReport', [ args ] ) );
	const report = useSelect( ( select ) => select( STORE_NAME ).getReport( args ) );

	if ( ! loaded ) {
		return <PreviewBlock width="282px" height="282px" shape="circular" />;
	}

	if ( error ) {
		return <ReportError moduleSlug="analytics" error={ error } />;
	}

	const absOthers = {
		current: report[ 0 ].data.totals[ 0 ].values[ 0 ],
		previous: report[ 0 ].data.totals[ 1 ].values[ 0 ],
	};

	report[ 0 ].data.rows.forEach( ( { metrics } ) => {
		absOthers.current -= metrics[ 0 ].values[ 0 ];
		absOthers.previous -= metrics[ 1 ].values[ 0 ];
	} );

	const dataMap = extractAnalyticsDataForPieChart( report, {
		withOthers: true,
		keyColumnIndex: 0,
		tooltipCallback: ( row, rowData ) => {
			let difference = row?.metrics?.[ 1 ]?.values?.[ 0 ] > 0
				? ( row.metrics[ 0 ].values[ 0 ] * 100 / row.metrics[ 1 ].values[ 0 ] ) - 100
				: 100;

			if ( row === null && absOthers.previous > 0 ) {
				difference = ( absOthers.current * 100 / absOthers.previous ) - 100;
			}

			const absValue = row ? row.metrics[ 0 ].values[ 0 ] : absOthers.current;
			const label = sprintf(
				/* translators: %s number of users */
				_n( '%s user', '%s users', absValue, 'google-site-kit' ),
				numberFormat( absValue ),
			);

			const statInfo = sprintf(
				/* translators: 1: up or down arrow , 2: different change in percentage, %%: percent symbol */
				_x( '%1$s %2$s%%', 'Stat information for user dimensions chart tooltip', 'google-site-kit' ),
				`<svg width="9" height="9" viewBox="0 0 10 10" fill="none" xmlns="http://www.w3.org/2000/svg" class="${ classnames( 'googlesitekit-change-arrow', {
					'googlesitekit-change-arrow--up': difference > 0,
					'googlesitekit-change-arrow--down': difference < 0,
				} ) }">
					<path d="M5.625 10L5.625 2.375L9.125 5.875L10 5L5 -1.76555e-07L-2.7055e-07 5L0.875 5.875L4.375 2.375L4.375 10L5.625 10Z" fill="currentColor" />
				</svg>`,
				Math.abs( difference ).toFixed( 2 ).replace( /(.00|0)$/, '' ), // .replace( ... ) removes trailing zeros
			);

			return (
				`<div class="${ classnames( 'googlesitekit-visualization-tooltip', {
					'googlesitekit-visualization-tooltip--up': difference > 0,
					'googlesitekit-visualization-tooltip--down': difference < 0,
				} ) }">
					<p>${ rowData[ 0 ].toUpperCase() }</p>
					<p>
						<em>${ statInfo }</em>
						<b style="margin-left:.5em">${ label }</b>
					</p>
				</div>`
			);
		},
	} );

	const labels = {
		'ga:channelGrouping': __( '<span>By</span> channels', 'google-site-kit' ),
		'ga:country': __( '<span>By</span> locations', 'google-site-kit' ),
		'ga:deviceCategory': __( '<span>By</span> devices', 'google-site-kit' ),
	};

	const sanitizeArgs = {
		ALLOWED_TAGS: [ 'span' ],
		ALLOWED_ATTR: [],
	};

	const title = chartLoaded
		? sanitizeHTML( labels[ dimensionName ] || '', sanitizeArgs )
		: { __html: '' };

	return (
		<div className="googlesitekit-widget--analyticsAllTrafficV2__dimensions-chart">
			<GoogleChart
				chartType="pie"
				options={ UserDimensionsPieChart.chartOptions }
				data={ dataMap }
				loadHeight={ 205 }
				onReady={ onReady }
			/>
			<div
				className="googlesitekit-widget--analyticsAllTrafficV2__dimensions-chart-title"
				dangerouslySetInnerHTML={ title }
			/>
		</div>
	);
}

UserDimensionsPieChart.propTypes = {
	dimensionName: PropTypes.string.isRequired,
};

UserDimensionsPieChart.defaultProps = {
	dimensionName: 'ga:channelGrouping',
};

UserDimensionsPieChart.chartOptions = {
	chartArea: {
		left: 0,
		height: 300,
		top: 50,
		width: '100%',
	},
	backgroundColor: 'transparent',
	fontName: 'Roboto',
	fontSize: 12,
	height: 410,
	legend: {
		alignment: 'center',
		position: 'bottom',
		textStyle: {
			color: 'black',
			fontSize: 12,
		},
	},
	pieHole: 0.6,
	pieSliceTextStyle: {
		color: 'black',
		fontName: 'Roboto',
		fontSize: 12,
	},
	slices: {
		0: { color: '#ffcd33' },
		1: { color: '#c196ff' },
		2: { color: '#9de3fe' },
		3: { color: '#ff7fc6' },
		4: { color: '#ff886b' },
	},
	title: null,
	tooltip: {
		isHtml: true, // eslint-disable-line sitekit/camelcase-acronyms
		trigger: 'both',
	},
	width: '100%',
};
