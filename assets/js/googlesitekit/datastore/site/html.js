/**
 * core/site data store: HTML for URL.
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
import invariant from 'invariant';

/**
 * WordPress dependencies
 */
import { isURL, addQueryArgs } from '@wordpress/url';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import { STORE_NAME } from './constants';
import { createFetchStore } from '../../../googlesitekit/data/create-fetch-store';

const { createRegistryControl } = Data;

const fetchHTMLForURLStore = createFetchStore( {
	baseName: 'getHTMLForURL',
	controlCallback: async ( { url } ) => {
		const fetchHTMLOptions = {
			credentials: 'omit',
		};
		const fetchHTMLQueryArgs = {
			// Indicates a tag checking request. This lets Site Kit know not to output its own tags.
			tagverify: 1,
			// Add a timestamp for cache-busting.
			timestamp: Date.now(),
		};
		const response = await fetch( addQueryArgs( url, fetchHTMLQueryArgs ), fetchHTMLOptions );
		if ( ! response.ok ) {
			throw {
				code: response.statusText,
				message: response.statusText,
				data: { status: response.status },
			};
		}
		const html = await response.text();

		return html;
	},
	reducerCallback: ( state, htmlForURL, { url } ) => {
		return {
			...state,
			htmlForURL: {
				...state.htmlForURL,
				[ url ]: htmlForURL,
			},
		};
	},
	argsToParams: ( url ) => {
		invariant( isURL( url ), 'a valid url is required to fetch HTML.' );
		return { url };
	},
} );

// Actions
const RESET_HTML_FOR_URL = 'RESET_HTML_FOR_URL';
const WAIT_FOR_HTML_FOR_URL = 'WAIT_FOR_HTML_FOR_URL';

export const BASE_INITIAL_STATE = {
	htmlForURL: {},
};

const baseActions = {
	/**
	 * Resets the HTML for a given URL.
	 *
	 * @since n.e.x.t
	 * @private
	 *
	 * @param {string} url URL for which the HTML should be reset.
	 * @return {Object} Redux-style action.
	 */
	*resetHTMLForURL( url ) {
		const { dispatch } = yield Data.commonActions.getRegistry();

		yield {
			payload: { url },
			type: RESET_HTML_FOR_URL,
		};

		return dispatch( STORE_NAME ).invalidateResolutionForStoreSelector( 'getHTMLForURL' );
	},
	/**
	 * Waits for HTML for to be resolved for the given account URL.
	 *
	 * @since n.e.x.t
	 * @private
	 *
	 * @param {string} url URL for which to fetch HTML.
	 * @yield {Object} Redux-style action.
	 */
	*waitForHTMLForURL( url ) {
		yield {
			payload: { url },
			type: WAIT_FOR_HTML_FOR_URL,
		};
	},
};

const baseControls = {
	[ WAIT_FOR_HTML_FOR_URL ]: createRegistryControl( ( registry ) => ( { payload: { url } } ) => {
		// Select first to ensure resolution is always triggered.
		registry.select( STORE_NAME ).getHTMLForURL( url );
		const isHTMLForURLLoaded = () => ( registry.select( STORE_NAME ).hasFinishedResolution( 'getHTMLForURL', [ url ] ) );

		if ( isHTMLForURLLoaded() ) {
			return;
		}

		return new Promise( ( resolve ) => {
			const unsubscribe = registry.subscribe( () => {
				if ( isHTMLForURLLoaded() ) {
					unsubscribe();
					resolve();
				}
			} );
		} );
	} ),
};

const baseReducer = ( state, { type, payload } ) => {
	switch ( type ) {
		case RESET_HTML_FOR_URL: {
			const { url } = payload;
			return {
				...state,
				htmlForURL: {
					...state.htmlForURL,
					[ url ]: undefined,
				},
				isFetchingHTMLForURL: {
					...state.isFetchingHTMLForURL,
					[ url ]: false,
				},
			};
		}

		default: {
			return { ...state };
		}
	}
};

export const baseResolvers = {
	*getHTMLForURL( url ) {
		const registry = yield Data.commonActions.getRegistry();

		const existingHTML = registry.select( STORE_NAME ).getHTMLForURL( url );

		if ( ! existingHTML ) {
			yield fetchHTMLForURLStore.actions.fetchGetHTMLForURL( url );
		}
	},
};

export const baseSelectors = {
	/**
	 * Gets the HTML for a given URL.
	 *
	 * Returns `undefined` if the HTML is not available/loaded.
	 *
	 * Returns a string representation of the HTML when successful.
	 *
	 * @private
	 * @since n.e.x.t
	 * @param {Object} state Data store's state.
	 * @param {string} url URL for which to fetch HTML.
	 * @return {(Object|undefined)} String representation of HTML for given URL.
	 */
	getHTMLForURL( state, url ) {
		const { htmlForURL = {} } = state;
		return htmlForURL[ url ];
	},
};

const store = Data.combineStores(
	fetchHTMLForURLStore,
	{
		INITIAL_STATE: BASE_INITIAL_STATE,
		actions: baseActions,
		controls: baseControls,
		reducer: baseReducer,
		resolvers: baseResolvers,
		selectors: baseSelectors,
	}
);

export const INITIAL_STATE = store.INITIAL_STATE;
export const actions = store.actions;
export const controls = store.controls;
export const reducer = store.reducer;
export const resolvers = store.resolvers;
export const selectors = store.selectors;

export default store;
