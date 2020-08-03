<?php
/**
 * Class Google\Site_Kit\Core\Storage\Has_Connected_Admins
 *
 * @package   Google\Site_Kit\Core\Storage
 * @copyright 2020 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\Storage;

use Google\Site_Kit\Core\Authentication\Clients\OAuth_Client;
use Google\Site_Kit\Core\Storage\Options_Interface;
use Google\Site_Kit\Core\Storage\Setting;
use Google\Site_Kit\Core\Storage\User_Options_Interface;

/**
 * Has_Connected_Admins class.
 *
 * @since n.e.x.t
 * @access private
 * @ignore
 */
class Has_Connected_Admins extends Setting {

	/**
	 * The option_name for this setting.
	 */
	const OPTION = 'googlesitekit_has_connected_admins';

	/**
	 * User options instance implementing User_Options_Interface.
	 *
	 * @since n.e.x.t
	 * @var User_Options_Interface
	 */
	protected $user_options;

	/**
	 * Constructor.
	 *
	 * @since n.e.x.t
	 *
	 * @param Options_Interface      $options      Options instance.
	 * @param User_Options_Interface $user_options User options instance.
	 */
	public function __construct( Options_Interface $options, User_Options_Interface $user_options ) {
		parent::__construct( $options );
		$this->user_options = $user_options;
	}

	/**
	 * Registers the setting in WordPress.
	 *
	 * @since n.e.x.t
	 */
	public function register() {
		parent::register();

		$access_token_meta_key = $this->user_options->get_meta_key( OAuth_Client::OPTION_ACCESS_TOKEN );

		add_action(
			'added_user_meta',
			function ( $mid, $uid, $meta_key ) use ( $access_token_meta_key ) {
				if ( $meta_key === $access_token_meta_key ) {
					$user = get_userdata( $uid );
					if ( ! empty( $user ) && in_array( 'administrator', (array) $user->roles ) ) {
						$this->set( true );
					}
				}
			},
			10,
			3
		);

		add_action(
			'deleted_user_meta',
			function ( $mid, $uid, $meta_key ) use ( $access_token_meta_key ) {
				if ( $meta_key === $access_token_meta_key ) {
					$this->delete();
				}
			},
			10,
			3
		);
	}

	/**
	 * Gets the value of the setting. If the option is not set yet, it pulls connected
	 * admins from the database and sets the option.
	 *
	 * @since n.e.x.t
	 *
	 * @return boolean TRUE if the site kit already has connected admins, otherwise FALSE.
	 */
	public function get() {
		// If the option doesn't exist, query the fresh value, set it and return it.
		if ( ! $this->has() ) {
			$users                = $this->query_connected_admins();
			$has_connected_admins = count( $users ) > 0;

			$this->set( (int) $has_connected_admins );

			return $has_connected_admins;
		}

		return (bool) parent::get();
	}

	/**
	 * Queries connected admins and returns an array of connected admin IDs.
	 *
	 * @since n.e.x.t
	 *
	 * @return array The array of connected admin IDs.
	 */
	protected function query_connected_admins() {
		return get_users(
			array(
				'meta_key'     => $this->user_options->get_meta_key( OAuth_Client::OPTION_ACCESS_TOKEN ), // phpcs:ignore WordPress.VIP.SlowDBQuery.slow_db_query_meta_key
				'meta_compare' => 'EXISTS',
				'role'         => 'administrator',
				'number'       => 1,
				'fields'       => 'ID',
			)
		);
	}

	/**
	 * Gets the expected value type.
	 *
	 * @since n.e.x.t
	 *
	 * @return string The type name.
	 */
	protected function get_type() {
		return 'boolean';
	}

}
