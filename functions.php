<?php 
	/* 
	Plugin Name: No Frills Account Sign Up
	Description: Used for storing account sign up forms
	Author: Alex McKay
	*/

	// Defuse
		// Dev
		//require_once('C:/xampp/php/lib/defuse-crypto.phar');
		// Live
		require_once('/var/www/lib/defuse-crypto.phar');
		use Defuse\Crypto\Crypto;
		use Defuse\Crypto\Key;
	// Load Scripts
		function get_nfas_plugin_scripts() {
			wp_enqueue_script('form-loader', plugin_dir_url(__FILE__) . 'form-loader.js', array('jquery'), true);
		}
		function get_nfas_plugin_styles() {
			wp_enqueue_style('bootstrap', get_template_directory_uri() . '/css/bootstrap/bootstrap.min.css');
			wp_enqueue_style('form-loader-style', plugin_dir_url(__FILE__) . '/css/style.css');
			wp_enqueue_style('font-awesome', get_template_directory_uri() . '/css/font-awesome.min.css');
		}
		
		add_action('admin_enqueue_scripts', 'get_nfas_plugin_scripts');
		add_action('admin_enqueue_scripts', 'get_nfas_plugin_styles');
	
	// Initialize Menu

		add_action('admin_menu', 'account_signups_admin_actions');
		function account_signups_admin_actions() {
			add_menu_page('Form Submissions', 'Form Submissions', 'manage_options', __FILE__, 'account_signups_admin');
		}

	// Ajax
		add_action('wp_ajax_form_list_loader', 'load_lists');
		add_action('wp_ajax_form_specific_loader', 'load_specific');
		add_action('wp_ajax_form_drop_sensitive', 'drop_sensitive');
		add_action('wp_ajax_form_drop_full', 'drop_full');
		function load_lists() {	
			// Get key instance
				function loadEncryptionKey() {
					// Dev
					//$keyAscii = file_get_contents('C:/xampp/key/llave.txt');
					// Live
					$keyAscii = file_get_contents('/etc/lib/llave.txt');
					return Key::loadFromAsciiSafeString($keyAscii);
				}

				$key = loadEncryptionKey();
			// DB Connection
				// Dev
				//require_once('C:/xampp/key/db.php');
				// Live
				require_once('/etc/lib/db.php');
			// connect to db
				$dsn = "mysql:host=$host;dbname=$db;charset=$charset";

				$opt = [
					PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
					PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
					PDO::ATTR_EMULATE_PREPARES => false,
				];

				$pdo = new PDO($dsn, $user, $pass, $opt);

				$tableSelected = $_GET['table'];
				$columnSelected = $_GET['column'];
				$orderSelected = $_GET['order'];

				if ($tableSelected == 'wp_nfas_fields') {
					$query = $pdo->prepare("SELECT id, applicantFirstName, applicantLastName, applicantStreetAddress, applicantCity, accountType, fuelType, submissionDate, formRead FROM " . $tableSelected . " ORDER BY " . $columnSelected . " " . $orderSelected);
					$query->execute();

					$results = array();
					while($result = $query->fetch(PDO::FETCH_ASSOC)) {
						$applicantFirstName = Crypto::decrypt($result['applicantFirstName'], $key, false);
						$applicantLastName = Crypto::decrypt($result['applicantLastName'], $key, false);
						$applicantStreetAddress = Crypto::decrypt($result['applicantStreetAddress'], $key, false);
						$decryptedResults = array(
							'applicantFirstName' => $applicantFirstName,
							'applicantLastName' => $applicantLastName,
							'applicantStreetAddress' => $applicantStreetAddress,
							'applicantCity' => $result['applicantCity'],
							'accountType' => $result['accountType'],
							'fuelType' => $result['fuelType'],
							'id' => $result['id'],
							'submissionDate' => $result['submissionDate'],
							'formRead' => $result['formRead'],
						);
						$results[] = $decryptedResults;
					}
					$pdo = "";
					wp_send_json($results);
				} elseif ($tableSelected == 'wp_nfach_fields') {
					$query = $pdo->prepare("SELECT id, nameSignature, submissionDate, streetAddress, city, formRead FROM " . $tableSelected . " ORDER BY " . $columnSelected . " " . $orderSelected);
					$query->execute();

					$results = array();
					while($result = $query->fetch(PDO::FETCH_ASSOC)) {
						$nameSignature = Crypto::decrypt($result['nameSignature'], $key, false);
						$streetAddress = Crypto::decrypt($result['streetAddress'], $key, false);
						$city = Crypto::decrypt($result['city'], $key, false);	
						$decryptedResults = array(
								'streetAddress' => $streetAddress,
								'city' => $city,
								'nameSignature' => $nameSignature,
								'id' => $result['id'],
								'submissionDate' => $result['submissionDate'],
								'formRead' => $result['formRead'],
							);
						
						$results[] = $decryptedResults;
					}
					$pdo = "";
					wp_send_json($results);
				}
		}
 		function load_specific() {
			// Get key instance
				function loadEncryptionKey() {
					// Dev
					//$keyAscii = file_get_contents('C:/xampp/key/llave.txt');
					// Live
					$keyAscii = file_get_contents('/etc/lib/llave.txt');
					return Key::loadFromAsciiSafeString($keyAscii);
				}

				$key = loadEncryptionKey();
			// connect to db
				// Dev
				//require_once('C:/xampp/key/db.php');
				// Live
				require_once('/etc/lib/db.php');

				$dsn = "mysql:host=$host;dbname=$db;charset=$charset";

				$opt = [
					PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
					PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
					PDO::ATTR_EMULATE_PREPARES => false,
				];

				$pdo = new PDO($dsn, $user, $pass, $opt);

				$id = $_GET['id'];
				$table = $_GET['table'];

				$stmt = $pdo->prepare("UPDATE " . $table . " SET formRead = 1 WHERE id like $id");
				$stmt->execute();
				if ($table == 'wp_nfas_fields') {
					$query = $pdo->prepare("SELECT * FROM " . $table . " WHERE id LIKE :id");
					$query->bindParam(':id', $id, PDO::PARAM_INT);
					$query->execute();

					$results = $query->fetch(PDO::FETCH_ASSOC);
					if(!$results) {
						$pdo = '';
						echo 'No results found';
					}
					// Decrypt
						$applicantFirstName = Crypto::decrypt($results['applicantFirstName'], $key, false);
						$applicantLastName = Crypto::decrypt($results['applicantLastName'], $key, false);
						$applicantTelephone = Crypto::decrypt($results['applicantTelephone'], $key, false);
						$applicantTelephone2 = Crypto::decrypt($results['applicantTelephone2'], $key, false);
						$applicantEmail = Crypto::decrypt($results['applicantEmail'], $key, false);
						$applicantStreet = Crypto::decrypt($results['applicantStreetAddress'], $key, false);
						// In case of deletion -- make N/A
						if($results['applicantSocial'] !== '') { 
							$applicantSSN = Crypto::decrypt($results['applicantSocial'], $key, false);
						} else {
							$applicantSSN = 'n/a';
						};
						$applicantLicense = Crypto::decrypt($results['applicantLicense'], $key, false);
						$coApplicantFirstName = Crypto::decrypt($results['coApplicantFirstName'], $key, false);
						$coApplicantLastName = Crypto::decrypt($results['coApplicantLastName'], $key, false);
						if($results['coApplicantPhone'] !== null) {
							$coApplicantPhone = Crypto::decrypt($results['coApplicantPhone'], $key, false);
						} else {
							$coApplicantPhone = 'n/a';
						}
						
						// In case of deletion -- make N/A
						if($results['coApplicantSocial'] !== '') { 
							$coApplicantSSN = Crypto::decrypt($results['coApplicantSocial'], $key, false);
						} else {
							$coApplicantSSN = 'n/a';
						};

						$coApplicantLicense = Crypto::decrypt($results['coApplicantLicense'], $key, false);

						$employerName = Crypto::decrypt($results['employerName'], $key, false);
						$employerTelephone = Crypto::decrypt($results['employerTelephone'], $key, false);
						$employerStreet = Crypto::decrypt($results['employerStreetAddress'], $key, false);

						$propertyStreet = Crypto::decrypt($results['propertyStreetAddress'], $key, false);

						$caretakerFirstName = Crypto::decrypt($results['caretakerFirstName'], $key, false);
						$caretakerLastName = Crypto::decrypt($results['caretakerLastName'], $key, false);
						$caretakerTelephone = Crypto::decrypt($results['caretakerTelephone'], $key, false);

						$landlordFirstName = Crypto::decrypt($results['landlordFirstName'], $key, false);
						$landlordLastName = Crypto::decrypt($results['landlordLastName'], $key, false);
						$landlordTelephone = Crypto::decrypt($results['landlordTelephone'], $key, false);
						$landlordTelephone2 = Crypto::decrypt($results['landlordTelephone2'], $key, false);
						$landlordStreet = Crypto::decrypt($results['landlordStreetAddress'], $key, false);

						$applicantNameSignature = Crypto::decrypt($results['applicantNameSignature'], $key, false);
						$coApplicantNameSignature = Crypto::decrypt($results['coApplicantNameSignature'], $key, false);

					// Echo decrypted fields
						$decryptedResults = array(
							'applicantFirstName' => $applicantFirstName,
							'applicantLastName' => $applicantLastName,
							'applicantTelephone' => $applicantTelephone,
							'applicantTelephone2' => $applicantTelephone2,
							'applicantEmail' => $applicantEmail,
							'applicantStreetAddress' => $applicantStreet,
							'applicantLicense' => $applicantLicense,
							'applicantSocial' => $applicantSSN,
							
							'coApplicantFirstName' => $coApplicantFirstName,
							'coApplicantLastName' => $coApplicantLastName,
							'coApplicantPhone' => $coApplicantPhone,
							'coApplicantSocial' => $coApplicantSSN,
							'coApplicantLicense' => $coApplicantLicense,

							'employerName' => $employerName,
							'employerTelephone' => $employerTelephone,
							'employerStreetAddress' => $employerStreet,

							'propertyStreetAddress' => $propertyStreet,

							'caretakerFirstName' => $caretakerFirstName,
							'caretakerLastName' => $caretakerLastName,
							'caretakerTelephone' => $caretakerTelephone,

							'landlordFirstName' => $landlordFirstName,
							'landlordLastName' => $landlordLastName,
							'landlordTelephone' => $landlordTelephone,
							'landlordTelephone2' => $landlordTelephone2,
							'landlordStreetAddress' => $landlordStreet,

							'applicantNameSignature' => $applicantNameSignature,
							'coApplicantNameSignature' => $coApplicantNameSignature,
						);
					
					foreach($results as $k => $v) {
						foreach($decryptedResults as $key => $val) {
							if($k == $key && $v != $val) {
								unset($results[$key]);
							}
						}
					}

					$mergedResults = array_merge($results, $decryptedResults);
					
					$jsonResults = array();
					$jsonResults[] = array_map('utf8_encode', $mergedResults);
					$pdo = "";
					wp_send_json($jsonResults);
				} elseif ($table == 'wp_nfach_fields') {
					$query = $pdo->prepare("SELECT * FROM " . $table . " WHERE id LIKE :id");
					$query->bindParam(':id', $id, PDO::PARAM_INT);
					$query->execute();

					$results = $query->fetch(PDO::FETCH_ASSOC);
					if(!$results) {
						$pdo = '';
						echo 'No results found';
					}

					// Decrypt
						$nameInstitution = Crypto::decrypt($results['nameInstitution'], $key, false);
						$streetInstitution = Crypto::decrypt($results['streetInstitution'], $key, false);
						$streetInstitution2 = Crypto::decrypt($results['streetInstitution2'], $key, false);
						$cityInstitution = Crypto::decrypt($results['cityInstitution'], $key, false);
						$stateInstitution = Crypto::decrypt($results['stateInstitution'], $key, false);
						$zipInstitution = Crypto::decrypt($results['zipInstitution'], $key, false);
						if ($results['accountNumber'] == '' ) {
							$accountNumber = 'n/a';
						} else {
							$accountNumber = Crypto::decrypt($results['accountNumber'], $key, false);
						}
						if ($results['accountType'] == '' ) {
							$accountType = 'n/a';
						} else {
							$accountType = Crypto::decrypt($results['accountType'], $key, false);
						}
						if ($results['routingNumber'] == '' ) {
							$routingNumber = 'n/a';
						} else {
							$routingNumber = Crypto::decrypt($results['routingNumber'], $key, false);
						}
						$withdrawAmount = Crypto::decrypt($results['withdrawAmount'], $key, false);
						$amount = Crypto::decrypt($results['amount'], $key, false);
						$streetAddress = Crypto::decrypt($results['streetAddress'], $key, false);
						$streetAddress2 = Crypto::decrypt($results['streetAddress2'], $key, false);
						$city = Crypto::decrypt($results['city'], $key, false);	
						$state = Crypto::decrypt($results['state'], $key, false);
						$zip = Crypto::decrypt($results['zip'], $key, false);
						$email = Crypto::decrypt($results['email'], $key, false);
						$nameSignature = Crypto::decrypt($results['nameSignature'], $key, false);

						$decryptedResults = array(
							'nameInstitution' => $nameInstitution,
							'streetInstitution' => $streetInstitution,
							'streetInstitution2' => $streetInstitution2,
							'cityInstitution' => $cityInstitution,
							'stateInstitution' => $stateInstitution,
							'zipInstitution' => $zipInstitution,
							'accountNumber' => $accountNumber,
							'accountType' => $accountType,
							'routingNumber' => $routingNumber,
							'withdrawAmount' => $withdrawAmount,
							'amount' => $amount,
							'streetAddress' => $streetAddress,
							'streetAddress2' => $streetAddress2,
							'city' => $city,
							'state' => $state,
							'zip' => $zip,
							'email' => $email,
							'nameSignature' => $nameSignature,
							'id' => $results['id'],
							'submissionDate' => $results['submissionDate'],
							'signatureAuthorization' => $results['signatureAuthorization'],
						);
					
					$jsonResults = array();
					$jsonResults[] = array_map('utf8_encode', $decryptedResults);
					$pdo = "";
					wp_send_json($jsonResults);
				}		
 		}
 		function drop_sensitive() {
 			// connect to db
			// Dev
			//require_once('C:/xampp/key/db.php');
			// Live
			require_once('/etc/lib/db.php');

			$dsn = "mysql:host=$host;dbname=$db;charset=$charset";

			$opt = [
				PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
				PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
				PDO::ATTR_EMULATE_PREPARES => false,
			];

			$pdo = new PDO($dsn, $user, $pass, $opt);

			$id = $_GET['id'];
			$table = $_GET['table'];
			print_r($id);
			print_r($table);
			
			if ($table == 'wp_nfas_fields') {
				$stmt = $pdo->prepare("UPDATE $table SET applicantSocial = null, coApplicantSocial = null WHERE id = $id");
				$stmt->execute();
			} elseif ($table == 'wp_nfach_fields') {
				$stmt = $pdo->prepare("UPDATE $table SET accountNumber = null, routingNumber = null WHERE id = $id");
				$stmt->execute();
			}

			$pdo = "";
			die();
 		}
 		function drop_full() {
 			// // connect to db
			// Dev
			//require_once('C:/xampp/key/db.php');
			// Live
			require_once('/etc/lib/db.php');

			$dsn = "mysql:host=$host;dbname=$db;charset=$charset";

			$opt = [
				PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
				PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
				PDO::ATTR_EMULATE_PREPARES => false,
			];

			$pdo = new PDO($dsn, $user, $pass, $opt);

			$id = $_GET['id'];
			$table = $_GET['table'];

			
			$stmt = $pdo->prepare("DELETE FROM $table WHERE id = $id");
			$stmt->execute();
			$pdo = "";
			die();
 		}

	// Image Loader Menu
		function account_signups_admin()
		{
		?>
		<div class="nav mt-5">
			<p id="nfas" class="mr-2 p-3">Account Sign-up Forms</p>
			<p id="nfach" class="ml-2 p-3">ACH Authorization Forms</p>
		</div>
		<div class="account-sign-ups" style="display: none" data-table="wp_nfas_fields">
			<h1>Account Sign up Forms</h1>
			<p>Click the links below to view/print the full form.</p>
			<div class="forms">
				<table class="form-list">
					<span class="back-to-list Hidden">&#8592; Back to list</span>
					<tr class="sort-by">
						<th class="order-control" data-col="id" data-order="DESC">ID<span class="order-arrow">&#8595;</span></th>
						<th data-col="applicantLastName" data-order="ASC">Name<span class="order-arrow"></span></th>
						<th data-col="accountType" data-order="ASC">Plan Type<span class="order-arrow"></span></th>
						<th data-col="submissionDate" data-order="ASC">Submission Date<span class="order-arrow"></span></th>
						<th data-col="applicantCity" data-order="ASC">Customer Address<span class="order-arrow"></span></th>
						<th data-col="fuelType" data-order="ASC">Fuel Type<span class="order-arrow"></span></th>
					</tr>
				</table>
			</div>
		</div>
		<div class="ach-authorizations" style="display: none" data-table="wp_nfach_fields">
			<h1>ACH Authorization Forms</h1>
			<p>Click the links below to view/print the full form.</p>
			<div class="forms">
				<table class="form-list">
					<span class="back-to-list Hidden">&#8592; Back to list</span>
					<tr class="sort-by">
						<th class="order-control" data-col="id" data-order="DESC">ID<span class="order-arrow">&#8595;</span></th>
						<th data-col="nameSignature" data-order="ASC">Name<span class="order-arrow"></span></th>
						<th data-col="submissionDate" data-order="ASC">Submission Date<span class="order-arrow"></span></th>
						<th data-col="city" data-order="ASC">Customer Address<span class="order-arrow"></span></th>
					</tr>
				</table>
			</div>
		</div>
		<?php
		}
?>