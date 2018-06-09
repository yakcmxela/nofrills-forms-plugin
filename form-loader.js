jQuery(document).ready(function() {
// DB
	var nfas = 'wp_nfas_fields';
	var nfach = 'wp_nfach_fields';
// Navigation
	jQuery('#nfas').on('click', function() {
		jQuery('.account-sign-ups').css('display', 'block');
		jQuery('.account-sign-ups .form-list').removeClass('Hidden');
		jQuery('.ach-authorizations').css('display', 'none');
		jQuery('.single-application-link').remove();
		jQuery('.full-app').remove();
		jQuery('.back-to-list').addClass('Hidden');
		loadForms(nfas, 'id', 'DESC');
	});
	jQuery('#nfach').on('click', function() {
		jQuery('.account-sign-ups').css('display', 'none');
		jQuery('.ach-authorizations .form-list').removeClass('Hidden');
		jQuery('.ach-authorizations').css('display', 'block');
		jQuery('.single-application-link').remove();
		jQuery('.full-app').remove()
		jQuery('.back-to-list').addClass('Hidden');
		loadForms(nfach, 'id', 'DESC');
	});
	jQuery('.back-to-list').on('click', function(e) {
		var table = jQuery(e.currentTarget).parent().parent().data('table');
		jQuery('.full-app').remove();
		jQuery('.form-list').removeClass('Hidden');
		jQuery(this).addClass('Hidden');
		jQuery('.single-application-link').remove();
		loadForms(table, 'id', 'DESC');
	});

// Convert dates
	function convertTime(val) {
		var year = val.slice(0, 4);
		var month = val.slice(5, 7);
		var day = val.slice(8, 10);
		var hour = val.slice(11, 13);

		function condenseTime(time) {
			var firstDigit = time.slice(0,1);
			var secondDigit = time.slice(1, 2);
			if (firstDigit == '0') {
				time = secondDigit;
			} 
			return time;
		}

		condenseTime(month);
		condenseTime(day);

		date = month + '/' + day + '/' + year;

		return date;
	}	

// Numbers with commas
	function numbersWithCommas(x) {
	  var parts = x.toString().split(".");
	  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
	  return parts.join(".");
	}

// Load list of forms
	var order;
	function loadForms(table, column, order) {
		var loadForms = jQuery.ajax({
			url: ajaxurl,
			method: 'GET',
			data: {
				table: table,
				column: column,
				order: order,
				action: 'form_list_loader'
			},
			dataType: 'json'
		});

		loadForms.fail(function(textStatus) {
			console.log(textStatus);
		});

		loadForms.done(function(data) {
			if (table == 'wp_nfas_fields') {
				jQuery.each(data, function(key, val) {
					var submissionDate = val.submissionDate;
					submissionDate = convertTime(submissionDate);
					if (val.formRead == 1) {
						var application = '<tr class="single-application-link" data-formid="' + val.id + '">';
					} else if (val.formRead == 0) {
						var application = '<tr class="single-application-link Unread" data-formid="' + val.id + '">';
					}
						application += '<th class="order">' + '<span>' + val.id + "</span>" + '</th>'
						application += '<th>' + val.applicantLastName + ', ' + val.applicantFirstName + '</th>';	
						application += '<th>' + val.accountType + '</th>';
						application += '<th>' + submissionDate + '</th>';
						application += '<th>' + val.applicantStreetAddress + ', ' + val.applicantCity + '</th>';
						application += '<th>' + val.fuelType + '</th>';
						application += '</th>';
					jQuery('.form-list').append(application);
				});
			} else if (table == 'wp_nfach_fields'){
				jQuery.each(data, function(key, val) {
					var submissionDate = val.submissionDate;
					submissionDate = convertTime(submissionDate);
					if (val.formRead == 1) {
						var application = '<tr class="single-application-link" data-formid="' + val.id + '">';
					} else if (val.formRead == 0) {
						var application = '<tr class="single-application-link Unread" data-formid="' + val.id + '">';
					}
						application += '<th class="order">' + '<span>' + val.id + "</span>" + '</th>'
						application += '<th>' + val.nameSignature + '</th>';	
						application += '<th>' + submissionDate + '</th>';
						application += '<th>' + val.streetAddress + ', ' + val.city + '</th>';
						application += '</th>';
					jQuery('.form-list').append(application);
				});
			};
		})
	}

// Load specific form on click
	var id;
	function loadSpecific(table, id) {
		var loadSpecific = jQuery.ajax({
			url: ajaxurl,
			method: 'GET',
			data: {
				id: id,
				table: table,
				action: 'form_specific_loader'
			},
			dataType: 'json' 
		});
		loadSpecific.fail(function(textStatus) {
			console.log(textStatus);
		});
		loadSpecific.done(function(data) {
			var fullApplication = '<div class="full-app">';
				fullApplication += '<div class="d-flex align-items-center"><i class="fa fa-print fa-2x m-2"></i><p class="button print-button">Print</p>';
				if (table == 'wp_nfas_fields') {
					fullApplication += '<i class="fa fa-eraser fa-2x m-2"></i><p class="button delete-sensitive">Remove SSN from database.</p>';
				} else if (table == 'wp_nfach_fields') {
					fullApplication += '<i class="fa fa-eraser fa-2x m-2"></i><p class="button delete-sensitive">Remove account information from database.</p>';
				}
				fullApplication += '<i class="fa fa-close fa-2x m-2"></i><p class="button delete-full">Remove full application from database.</p></div>';
			if (table == 'wp_nfas_fields') {
				jQuery.each(data, function(key, val) {
					var applicantDOB = convertTime(val.applicantDOB);
					var coApplicantDOB = convertTime(val.coApplicantDOB);
					var employerStart = convertTime(val.employerStart);

						// Bootstrap container
						fullApplication += '<div class="container start-print p-5" data-formid=' + val.id + '>';
						// Start form section personal info
							fullApplication += '<div class="row applicant">';
							fullApplication += '<div style="width: 50%; padding: 0px 12px;">';
							// Applicant
							fullApplication += '<h4 style="background-color: #101e28; font-size: 18px; padding: 12px; color: white;"><strong>Applicant</strong></h4><p>';
							fullApplication += '<strong>' + val.applicantFirstName + ' ' + val.applicantLastName + '</strong><br/>';
							fullApplication += val.applicantStreetAddress;
							if (val.applicantStreetAddress2 !== 'n/a') {
								fullApplication += ', ' + val.applicantStreetAddress2 + '<br/>';
							} else {
								fullApplication += '<br/>';
							}
							fullApplication += val.applicantCity + ', ' + val.applicantState + ' ' + val.applicantZip + '</p>';
							fullApplication += '<p>';
							fullApplication += val.accountType + '<br/>';
							fullApplication += '<span>Primary:</span> ' + val.applicantTelephone + '<br/><span>Secondary:</span> ' + val.applicantTelephone2 + '<br/>';
							fullApplication += '<span>Email:</span> ' + val.applicantEmail + '<br/>';
							fullApplication += '<br/>';
							if (applicantDOB !== 'n/a') {
								fullApplication += '<span>Date of Birth:</span> ' + applicantDOB + '<br/>';
							} else {
								fullApplication += '<span>Date of Birth:</span>n/a<br/>'; 
							}
							if (val.applicantLicense == '') {
								fullApplication += "<span>Driver's License: n/a</span><br/>";		
							} else {
								fullApplication += "<span>Driver's License:</span> " + val.applicantLicense + '<br/>';								
							}
							fullApplication += '<span>Social Security:</span> ' + val.applicantSocial;
							fullApplication += '</p>';
							fullApplication += '<p>';
							fullApplication += '<span>Signed Name: </span>' + val.applicantNameSignature + '<br/>' + val.applicantSignatureAuthorization + '<br/>';
							if(val.coApplicantNameSignature !== 'n/a') {
								fullApplication += '<span>Co-signed Name: </span>' + val.coApplicantNameSignature + '<br/>' + val.coApplicantSignatureAuthorization + '<br/>';							
							}
							fullApplication += '</div>';
							// Co-applicant
							fullApplication += '<div class="personal info" style="width: 50%; padding: 0px 12px;">';
							fullApplication += '<h4 style="background-color: #101e28; font-size: 18px; padding: 12px; color: white;"><strong>Co-applicant</strong></h4><p>';
							if(val.coApplicantFirstName == '' && val.coApplicantLastName == '') {
								fullApplication += '<p>No co-applicant submitted.';
							} else {
								fullApplication += val.coApplicantFirstName + ' ' + val.coApplicantLastName + '<br/>';
								if (val.coApplicantDOB == 'n/a') {
									fullApplication += '<span>Date of Birth: n/a</span><br/>';
								} else {
									fullApplication += '<span>Date of Birth:</span> ' + coApplicantDOB + '<br/>';
								}
								fullApplication += '<span>Telephone: ' + val.coApplicantPhone + '<br/>';
								fullApplication += "<span>Driver's License:</span> " + val.coApplicantLicense + '<br/>';
								fullApplication += '<span>Social Security:</span> ' + val.coApplicantSocial;
							}
							fullApplication += '</p>';
							// Employer
							fullApplication += '<h4 style="background-color: #101e28; font-size: 18px; padding: 12px; color: white;"><strong>Current Employer</strong></h4><p>';
							if(val.employerName == '' && val.employerStreetAddress == '') {
								fullApplication += '<p>No employer submitted.';
							} else {
								fullApplication += val.employerName + '<br/>';
								fullApplication += val.employerStreetAddress;
								if (val.employerStreetAddress2 !== 'n/a') {
									fullApplication += ', ' + val.employerStreetAddress2 + '<br/>';
								} else {
									fullApplication += '<br/>';
								}
								if (val.employerCity !== 'n/a' || val.employerZip !== 'n/a') {
									fullApplication += val.employerCity + ', ' + val.employerState + ' ' + val.employerZip + '<br/>';
								}
								fullApplication += val.employerTelephone + '<br/>';
								if (val.employerStart !== 'n/a') {
									fullApplication += '<span>Started on:</span> ' + employerStart + '<br/>';
								} else {
									fullApplication += '<span>Started on:</span>n/a<br/>';
								}
								if (val.annualIncome !== 'n/a') {
									fullApplication += '<span>Annual income:</span> $' + numbersWithCommas(val.annualIncome) + '<br/>';	
								} else {
									fullApplication += '<span>Annual income:</span> None submitted.<br/>';
								}
								if (val.otherIncome !== 'n/a') {
									fullApplication += '<span>Additional income:</span> $' + numbersWithCommas(val.otherIncome);
								} else {
									fullApplication += '<span>Annual income:</span> None submitted.<br/>';
								}
							}
							fullApplication += '</p></div></div><hr>';
						// Start Property info
							fullApplication += '<div class="row property">';
							fullApplication += '<div style="width: 50%; padding: 0px 12px;">';
							// Property
							fullApplication += '<h4 style="background-color: #101e28; font-size: 18px; padding: 12px; color: white;"><strong>Property Information</strong></h4><p>';
							fullApplication += val.propertyStreetAddress;
							if (val.propertyAddress2 !== 'n/a') {
								fullApplication += ', ' +  val.propertyStreetAddress2 + '<br/>';
							} else {
								fullApplication += '<br/>';
							}
							fullApplication += val.propertyCity + ', ' + val.propertyState + ' ' + val.propertyZip + '<br/><br/>';
							fullApplication += '<span>Additional details (directions):</span> ' + val.propertyDetails + '<br/>';
							fullApplication += '<span>Property type:</span> ' + val.propertyType + '<br/>';
							fullApplication += '<span>Fuel type:</span> ' + val.fuelType + '<br/>';
							fullApplication += '<span>Property occupied:</span> ' + val.propertyOccupied + '<br/>';
							fullApplication += '<span>Automatic deliveries:</span> ' + val.automaticDeliveries + '<br/>';
							fullApplication += '<span>Wood heating:</span> ' + val.woodHeating + '<br/>';
							fullApplication += '<span>Property seasonal:</span> ' + val.propertySeasonal;
							fullApplication += '</p></div>';

							// Caretaker
							fullApplication += '<div style="width: 50%; padding: 0px 12px;">';
							fullApplication += '<h4 style="background-color: #101e28; font-size: 18px; padding: 12px; color: white;"><strong>Caretaker Information</strong></h4><p>';
							if (val.propertyCaretaker !== 'Yes') {
								fullApplication += 'No caretaker submitted.';
							} else if (val.caretakerFirstName == '' && val.caretakerLastName == '' && val.caretakerTelephone == '') {
								fullApplication += 'No caretaker submitted.';
							} else {
								fullApplication += val.caretakerFirstName + ' ' + val.caretakerLastName + '<br/>';
								fullApplication += val.caretakerTelephone;
							}
							fullApplication += '</p>';
							// Landlord / Mortgage holder
							fullApplication += '<h4 style="background-color: #101e28; font-size: 18px; padding: 12px; color: white;"><strong>Landlord or Mortgage Holder</strong></h4><p>';
							fullApplication += val.landlordFirstName + ' ' + val.landlordLastName + '<br/>';
							fullApplication += val.landlordStreetAddress;
							if (val.landlordStreetAddress2 !== 'n/a') {
								fullApplication += ', ' + val.landlordStreetAddress2 + '<br/>';
							} else {
								fullApplication += '<br/>';
							}
							fullApplication += val.landlordCity + ', ' + val.landlordState + ' ' + val.landlordZip + '</p>';
							fullApplication += '<p>';
							fullApplication += '<span>Primary:</span> ' + val.landlordTelephone + '<br/><span>Secondary:</span> ' + val.landlordTelephone2 + '<br/>';
							fullApplication += '</p></div></div><hr>';

							// Heating oil service
							fullApplication += '<div class="row services">';
							fullApplication += '<div style="width: 50%; padding: 0px 12px;">';
							fullApplication += '<h4 style="background-color: #101e28; font-size: 18px; padding: 12px; color: white;"><strong>Home Heating Oil</strong></h4><p>';
							if (val.oilNewTank && val.oilPipeVented && val.oilMonitor && val.oilTankSize && val.oilTankQuantity && val.oilTankFillLevel && val.oilTankLocation && val.oilFillLocation && val.oilHotWater && val.oilNeedDelivery == 'n/a') {
								fullApplication += 'Not applicable.';
							} else {
								fullApplication += '<span>New tank:</span> ' + val.oilNewTank + '<br/>';
								fullApplication += '<span>Pipe vented:</span> ' + val.oilPipeVented + '<br/>';
								fullApplication += '<span>Monitor:</span> ' + val.oilMonitor + '<br/>';
								fullApplication += '<span>Tank size:</span> ' + val.oilTankSize + '<br/>';
								fullApplication += '<span>How many tanks:</span> ' + val.oilTankQuantity + '<br/>';
								fullApplication += '<span>Current fill level:</span> ' + val.oilTankFillLevel + '<br/>';
								fullApplication += '<span>Tank location:</span> ' + val.oilTankLocation + '<br/>';
								fullApplication += '<span>Tank fill location:</span> ' + val.oilFillLocation + '<br/>';
								fullApplication += '<span>Heats hot water:</span> ' + val.oilHotWater + '<br/>';
								fullApplication += '<span>Need delivery:</span> ' + val.oilNeedDelivery + '<br/>';
							}
							fullApplication += '</p></div>';

							// Propane service
							fullApplication += '<div style="width: 50%; padding: 0px 12px;">';
							fullApplication += '<h4 style="background-color: #101e28; font-size: 18px; padding: 12px; color: white;"><strong>Propane Use</strong></h4><p>';
							if (val.propaneAppliancesRange == 'n/a' && val.propaneAppliancesFurnace == 'n/a' && val.propaneAppliancesBoiler == 'n/a' && val.propaneAppliancesWaterheater == 'n/a' && val.propaneAppliancesSpaceheater == 'n/a' && val.propaneAppliancesDryer == 'n/a' && val.propaneAppliancesFireplace == 'n/a' && val.propaneAppliancesAdditional == 'n/a') {
								fullApplication += 'Not applicable.'
							} else {
								fullApplication += '<span>Range:</span> ' + val.propaneAppliancesRange + '<br/>';
								fullApplication += '<span>Furnace:</span> ' + val.propaneAppliancesFurnace + '<br/>';
								fullApplication += '<span>Boiler:</span> ' + val.propaneAppliancesBoiler + '<br/>';
								fullApplication += '<span>Water Heater:</span> ' + val.propaneAppliancesWaterheater + '<br/>';
								fullApplication += '<span>Space Heater:</span> ' + val.propaneAppliancesSpaceheater + '<br/>';
								fullApplication += '<span>Dryer:</span> ' + val.propaneAppliancesDryer + '<br/>';
								fullApplication += '<span>Fireplace:</span> ' + val.propaneAppliancesFireplace + '<br/>';
								fullApplication += '<span>Additional appliances:</span> ' + val.propaneAppliancesAdditional + '<br/>';
							}
							fullApplication += '</p></div>';

							// New propane install
							fullApplication += '<div style="width: 50%; padding: 0px 12px;">';
							fullApplication += '<h4 style="background-color: #101e28; font-size: 18px; padding: 12px; color: white;"><strong>New Propane Installation</strong></h4><p>';
							if (val.newPropaneLinesOut == 'n/a' && val.newPropaneWhoLines == 'n/a' && val.newPropaneWhoLinesTelephone == 'n/a' && val.newPropaneTankSize == 'n/a' && val.newPropaneTankQuantity == 'n/a' && val.newPropaneUse == 'n/a') {
								fullApplication += 'Not applicable';
							} else {
								fullApplication += '<span>Are the inside lines run to the outside:</span> ' + val.newPropaneLinesOut + '<br/>';
								fullApplication += '<span>Who ran the lines:</span> ' + val.newPropaneWhoLines + '<br/>';
								fullApplication += '<span>Telephone:</span> ' + val.newPropaneWhoLinesTelephone + '<br/>';
								fullApplication += '<span>Tank size needed:</span> ' + val.newPropaneTankSize + '<br/>';
								fullApplication += '<span>How many tanks:</span> ' + val.newPropaneTankQuantity + '<br/>';
								fullApplication += '<span>Anticipated usage:</span> ' + val.newPropaneUse + '<br/>';
							}
							fullApplication += '</p></div>';

							// Tank change out
							fullApplication += '<div style="width: 50%; padding: 0px 12px;">';
							fullApplication += '<h4 style="background-color: #101e28; font-size: 18px; padding: 12px; color: white;"><strong>Tank Change Out</strong></h4><p>';	
							if (val.tankChangeCurrentTank == 'n/a' && val.tankChangeCurrentQuantity == 'n/a' && val.tankChangeCurrentFillLevel == 'n/a' && val.tankChangeUse == 'n/a') {
								fullApplication += 'Not applicable.';
							} else {
								fullApplication += '<span>Current tank size:</span> ' + val.tankChangeCurrentTank + '<br/>';
								fullApplication += '<span>How many tanks currently:</span> ' + val.tankChangeCurrentQuantity + '<br/>';
								fullApplication += '<span>Current tank fill level:</span> ' + val.tankChangeCurrentFillLevel + '<br/>';
								fullApplication += '<span>Anticipated usage:</span> ' + val.tankChangeUse + '<br/>';
							}		
							fullApplication += '</p></div>';
		
						// Close bootstrap container / row
						fullApplication += '</div></div>'
				});
			} else if (table == 'wp_nfach_fields') {
				jQuery.each(data, function(key, val){
					// Bootstrap container
						fullApplication += '<div class="container start-print p-5" data-formid=' + val.id + '>';
						// Start form section personal info
							fullApplication += '<div class="row">';
							fullApplication += '<div style="width: 50%; padding: 0px 12px;">';
							// Applicant
							fullApplication += '<h4 style="background-color: #101e28; font-size: 18px; padding: 12px; color: white;"><strong>Applicant</strong></h4><p>';
							fullApplication += '<strong>' + val.nameSignature + '</strong><br/>';
							fullApplication += val.streetAddress;
							if (val.streetAddress2 !== 'n/a') {
								fullApplication += ', ' + val.streetAddress2 + '<br/>';
							} else {
								fullApplication += '<br/>';
							}
							fullApplication += val.city + ', ' + val.state + ' ' + val.zip + '</p>';
							fullApplication += '<p>' + val.email + '</p>';

							fullApplication += '<p>';
							if(val.signatureAuthorization !== 'n/a') {
								fullApplication += '<span>Authorization: </span>' + val.signatureAuthorization;							
							}
							fullApplication += '</div>';
							// Financial Institution
							fullApplication += '<div style="width: 50%; padding: 0px 12px;">';
							fullApplication += '<h4 style="background-color: #101e28; font-size: 18px; padding: 12px; color: white;"><strong>Financial Institution</strong></h4><p>';
	
							fullApplication += val.nameInstitution + '<br/>';
							fullApplication += val.streetInstitution;
							if (val.streetInstitution2 !== 'n/a') {
								fullApplication += ', ' + val.streetInstitution2 + '<br/>';
							} else {
								fullApplication += '<br/>';
							}
							fullApplication += val.cityInstitution + ', ' + val.stateInstitution + ' ' + val.zipInstitution + '<br/>';
							if(val.accountType !== 'n/a') {
								fullApplication += '<span>Account Type:</span> ' + val.accountType + '<br/>';
							}
							fullApplication += '<span>Account Number:</span> ' + val.accountNumber + '<br/>';
							fullApplication += '<span>Routing Number:</span> ' + val.routingNumber + '<br/>';
							fullApplication += '<span>Withdrawal Amount:</span> ' + val.withdrawAmount + ' at $' + numbersWithCommas(val.amount);
							fullApplication += '</p></div></div><hr>';
		
							// Close bootstrap container / row
							fullApplication += '</div></div>'
				})
			}
			jQuery('.form-list').addClass('Hidden');
			jQuery('.forms').append(fullApplication);
		});
	}
	var table;
	jQuery('.form-list').on('click', '.single-application-link', function(e) {
		id = jQuery(e.currentTarget).data('formid');
		jQuery('.back-to-list').removeClass('Hidden');
		table = jQuery(e.currentTarget).parent().parent().parent().parent().data('table');
		loadSpecific(table, id);
	});

// Reorder list

	var order;
	var column;
	jQuery('.sort-by th').on('click', function(e) {
		// Find table
		var table = jQuery(e.currentTarget).parent().parent().parent().parent().parent().data('table');
		// Remove all arrows
		jQuery('.order-arrow').text('');
		// Get column and order for query
		column = jQuery(e.currentTarget).data('col');
		order = jQuery(e.currentTarget).data('order');
		// Symbol for order
		var arrow;
		// Reset form list
		jQuery('.single-application-link').remove();
		// Load forms in new order
		loadForms(table, column, order);
		// Update data fields and arrows
		if (order == 'DESC' ) {
			order = 'ASC';
			arrow = ' \u2191';
		} else if (order == 'ASC') {
			order = 'DESC';
			arrow = ' \u2193';
		}
		jQuery(e.currentTarget).data('order', order);
		jQuery(e.currentTarget).find('.order-arrow').text(arrow);
	});

// Drop entire form
	function dropFull(table, id) {
		var dropSensitive = jQuery.ajax({
			url: ajaxurl,
			data: {
				table: table,
				id: id,
				action: 'form_drop_full'
			},
		});

		dropSensitive.fail(function(textStatus) {
			console.log(textStatus);
		});

		dropSensitive.done(function(data) {

		});
	}
	jQuery('.forms').on('click', '.delete-full', function(e) {
		id = jQuery(e.currentTarget).parent().siblings('.container').data('formid');
		table = jQuery(e.currentTarget).parent().parent().parent().parent().data('table');

		var conf = confirm('Clicking OK will PERMANENTLY DELETE THIS FORM from the database.');
		if (conf == true) {
			dropFull(table, id);
			jQuery('.full-app').remove();
			jQuery('.form-list').removeClass('Hidden');
			jQuery(this).addClass('Hidden');
			jQuery('.single-application-link').remove();
			loadForms(table, 'id', 'DESC');
		}
	})
// Delete Sensitive Info
	function dropSensitive(table, id) {
		var dropSensitive = jQuery.ajax({
			url: ajaxurl,
			data: {
				table: table,
				id: id,
				action: 'form_drop_sensitive'
			},
		});

		dropSensitive.fail(function(textStatus) {
			console.log(textStatus);
		});

		dropSensitive.done(function(data) {
		
		});
	};
	jQuery('.forms').on('click', '.delete-sensitive', function(e) {
		id = jQuery(e.currentTarget).parent().siblings('.container').data('formid');
		table = jQuery(e.currentTarget).parent().parent().parent().parent().data('table');

		var conf = confirm('Clicking OK will PERMANENTLY DELETE THIS FIELD from the database.');
		if (conf == true) {
			dropSensitive(table, id);
			jQuery('.full-app').remove();
			loadSpecific(table, id);
		}
	})
// Print
	jQuery('.forms').on('click', '.print-button', function() {
		var pageToPrint = jQuery('.start-print').html();
		var header = jQuery('head').html();
		var newWindow = window.open();
		var html = "<!DOCTYPE HTML>";
		html += '<html><head>' + header + '</head>';
		html += '<body style="background-color: white; max-width: 1200px; margin: 24px" onload="window.print()">';
		html += pageToPrint;
		html += '<script>window.print();</script>';
		html += '</body>';
    	html += '</html>';
    	newWindow.document.write(html);
    });

});