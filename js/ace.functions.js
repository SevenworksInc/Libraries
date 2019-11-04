//Ace Default Functions


// Administrator
// aceadmin/elements.html
$(".adminpageDelete").on('click', function () {
    bootbox.confirm("<h3 class='header smaller lighter blue'>Delete Page</h3>Are you sure?", function (result) {
        if (result) {
            bootbox.alert("You are sure!");
        }
    });
});

// aceadmin/form-elements.html
$(".chzn-select").chosen();



// Contact Us
// aceadmin/elements.html

/* Temporary Removed
$(".contactusReply").on('click', function () {
	bootbox.dialog("<h3 class='header smaller lighter blue'>Reply</h3><form class='form-horizontal'><div class='control-group'><label class='control-label' for='name'>Name</label><div class='controls'><input type='text' id='name' placeholder='Name' /></div></div><div class='control-group'><label class='control-label' for='replyto'>Reply To</label><div class='controls'><input type='email' id='replyto' placeholder='Reply To' /></div></div> <div class='control-group'><label class='control-label' for='subject'>Subject</label><div class='controls'><input type='text' id='subject' placeholder='Subject' /></div></div> <div class='control-group'><label class='control-label' for='message'>Message</label><div class='controls'><textarea class='limited' id='message' data-maxlength='50'  placeholder='Message'></textarea></div></div></form>", [{
		"label": "Submit",
		"class": "btn-small btn-success",
		"callback": function () {
			//Example.show("great success");
		}
	}, {
		"label": "Cancel",
		"class": "btn-small"
	}]);
});

$(".contactusView").on('click', function () {
	bootbox.dialog("<h3 class='header smaller lighter blue'>View Contact</h3><dl class='dl-horizontal'><dt>Name</dt><dd>Sarah Goring</dd><dt>Email</dt><dd>sarah.goring2@googlemail.com</dd><dt>Phone</dt><dd>09062634239</dd><dt>Subject</dt><dd>Inquiry | TUR05</dd><dt>Message</dt><dd>Dear Sirs, I wanted to know how much this ring is and also the two tone platinum ring? Do you have a similar ring in white or yellow gold? Do you keep sizes in stock or do they need to be ordered? If ordering is required, how long does this usually take? Many thanks Sarah</dd><dt>Date</dt><dd>2014-01-08 17:34:21</dd></dl>", [{
		"label": "Close",
		"class": "btn-small"
	}]);
});
*/

$(".contactusDelete").on('click', function () {
    bootbox.confirm("<h3 class='header smaller lighter blue'>Delete Contact User</h3>Are you sure?", function (result) {
        if (result) {
            bootbox.alert("You are sure!");
        }
    });
});



// newsLetter
// aceadmin/elements.html
$(".newsletterDelete").on('click', function () {
    bootbox.confirm("<h3 class='header smaller lighter blue'>Delete Contact User</h3>Are you sure you want to delete this item?", function (result) {
        if (result) {
            bootbox.alert("You are sure!");
        }
    });
});

/*
$(".newsletterView").on('click', function () {
	bootbox.dialog("<h3 class='header smaller lighter blue'>View Subscriber</h3><dl class='dl-horizontal'><dt>Date Added</dt><dd>December 4, 2013</dd><dt>Email</dt><dd>0</dd></dl>", [{
		"label": "Close",
		"class": "btn-small"
	}]);
});
*/


