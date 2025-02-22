/**
 * DataTable component.
 *
 * Site Kit by Google, Copyright 2021 Google LLC
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
import classnames from 'classnames';
import {
	each,
} from 'lodash';

/**
 * Internal dependencies
 */
import SourceLink from './SourceLink';
import Link from './Link';
import getFullURL from '../util/getFullURL';
import { getSiteKitAdminURL } from '../util';

// Construct a table component from a data object.
export const getDataTableFromData = ( data, headers, options ) => {
	const dataRows = [];

	const {
		links,
		source,
		showURLs,
		useAdminURLs = false,
		PrimaryLink = Link,
	} = options;

	if ( options.cap ) {
		data = data.slice( 0, options.cap );
	}

	each( data, ( row, j ) => {
		const cells = [];
		const link = links && links[ j ];
		const permaLink = link && link[ 0 ] === '/' ? getFullURL( global._googlesitekitLegacyData.admin.siteURL, link ) : link;

		each( row, ( cell, i ) => {
			// Replace (none) by direct.
			if ( 'string' === typeof cell ) {
				cell = cell.replace( /\(none\)/gi, 'direct' );
			}

			const hiddenOnMobile = options && options.hideColumns && options.hideColumns.mobile.includes( i );

			cells.push(
				<td
					key={ 'cell-' + i }
					className={ classnames(
						'googlesitekit-table__body-item',
						{ 'hidden-on-mobile': hiddenOnMobile }
					) }
				>
					{ row[ 0 ] === cell && link
						? <div className="googlesitekit-table__body-item-content">
							<PrimaryLink
								className="googlesitekit-table__body-item-link"
								href={ useAdminURLs ? getSiteKitAdminURL( 'googlesitekit-dashboard', { permaLink } ) : link }
								external={ ! useAdminURLs }
								inherit
							>
								{ cell }
							</PrimaryLink>

							{ showURLs &&
								<Link
									className="googlesitekit-table__body-item-url"
									href={ link }
									inherit
									external
								>
									{ link }
								</Link>
							}
						</div>
						: <div className="googlesitekit-table__body-item-content">{ cell }</div>
					}
				</td>
			);
		} );

		dataRows.push(
			<tr key={ 'tr-' + j } className="googlesitekit-table__body-row">
				{ cells }
			</tr>
		);
	} );

	const columns = data && data[ 0 ] && data[ 0 ].length ? data[ 0 ].length : 1;
	const mobileColumns = ( options.hideColumns && options.hideColumns.mobile && options.hideColumns.mobile.length > 0 )
		? columns - options.hideColumns.mobile.length
		: columns;

	return (
		<div className={ classnames(
			'googlesitekit-table',
			{ 'googlesitekit-table--with-list': ! options || ! options.disableListMode }
		) }>
			<table className={ classnames(
				'googlesitekit-table__wrapper',
				`googlesitekit-table__wrapper--${ columns }-col`,
				{ [ `googlesitekit-table__wrapper--mobile-${ mobileColumns }-col` ]: ( mobileColumns !== columns ) }
			) }>
				<thead className="googlesitekit-table__head">
					<tr
						key="gksc_data_row_header-wrap"
						style={ ( options && options.hideHeader ) ? { display: 'none' } : {} }
						className="googlesitekit-table__head-row"
					>
						{ headers.map( ( header, i ) => {
							const hiddenOnMobile = options && options.hideColumns && options.hideColumns.mobile.includes( i );
							return (
								<th
									key={ `gksc_data_row_header-${ i }` }
									className={ classnames(
										'googlesitekit-table__head-item',
										{ 'googlesitekit-table__head-item--primary': header.primary },
										{ 'hidden-on-mobile': hiddenOnMobile },
									) }
									data-tooltip={ header.tooltip }
								>
									{ header.title }
								</th>
							);
						} ) }
					</tr>
				</thead>
				<tbody className="googlesitekit-table__body">
					{ dataRows }
				</tbody>
			</table>
			{ source && (
				<SourceLink
					className="googlesitekit-table__source"
					name={ source.name }
					href={ source.link }
				/>
			) }
		</div>
	);
};

