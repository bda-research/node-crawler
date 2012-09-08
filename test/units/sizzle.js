
QUnit.module("selector");

var path = require( "path" ).normalize( __dirname + "/.." ),
    util = require('util'),
    fs = require("fs"),
    Crawler = require(path + "/lib/crawler.js").Crawler;

global.Sizzle = function(s) {
	console.error("Sizzle not overriden!");
}

var document,window,jQuery,navigator={userAgent:"Mozilla/5.0"};

var crawler = new Crawler();

var oldTest = test;

test = function(name,actualTest) {
    
    fs.readFile(require( "path" ).normalize( __dirname + "/sizzle.html" ), 'utf-8', function (err, data) {
            
      crawler.queue({"html":data,"callback":function(error,response,$) {
      
          window = response.window;
          global.document = window.document;
          global.jQuery = $;
          global.Sizzle = $;

    			oldTest(name,actualTest);

      }});
    });
};




/* Below are the official Sizzle tests */
/*
(function() {
	// Nullify querySelector all if noqsa=true is in the params
	// Isolates the Sizzle API
	QUnit.config.urlConfig.push( "noqsa" );
	if ( QUnit.urlParams.noqsa ) {
		document.querySelectorAll = null;
	}
})();
*/

/**
 * Returns an array of elements with the given IDs
 * @example q("main", "foo", "bar")
 * @result [<div id="main">, <span id="foo">, <input id="bar">]
 */
function q() {
	var r = [],
		i = 0;

	for ( ; i < arguments.length; i++ ) {
		r.push( document.getElementById( arguments[i] ) );
	}
	return r;
}

/**
 * Asserts that a select matches the given IDs
 * @param {String} a - Assertion name
 * @param {String} b - Sizzle selector
 * @param {String} c - Array of ids to construct what is expected
 * @example t("Check for something", "//[a]", ["foo", "baar"]);
 * @result returns true if "//[a]" return two elements with the IDs 'foo' and 'baar'
 */
function t( a, b, c ) {
	var f = Sizzle(b),
		s = "",
		i = 0;

	for ( ; i < f.length; i++ ) {
		s += ( s && "," ) + '"' + f[ i ].id + '"';
	}

	deepEqual(f, q.apply( q, c ), a + " (" + b + ")");
}

/**
 * Add random number to url to stop caching
 *
 * @example url("data/test.html")
 * @result "data/test.html?10538358428943"
 *
 * @example url("data/test.php?foo=bar")
 * @result "data/test.php?foo=bar&10538358345554"
 */
function url( value ) {
	return value + (/\?/.test(value) ? "&" : "?") + new Date().getTime() + "" + parseInt(Math.random()*100000);
}

var createWithFriesXML = function() {
	var string = '<?xml version="1.0" encoding="UTF-8"?> \
	<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/" \
		xmlns:xsd="http://www.w3.org/2001/XMLSchema" \
		xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"> \
		<soap:Body> \
			<jsconf xmlns="http://www.example.com/ns1"> \
				<response xmlns:ab="http://www.example.com/ns2"> \
					<meta> \
						<component id="seite1" class="component"> \
							<properties xmlns:cd="http://www.example.com/ns3"> \
								<property name="prop1"> \
									<thing /> \
									<value>1</value> \
								</property> \
								<property name="prop2"> \
									<thing att="something" /> \
								</property> \
								<foo_bar>foo</foo_bar> \
							</properties> \
						</component> \
					</meta> \
				</response> \
			</jsconf> \
		</soap:Body> \
	</soap:Envelope>';

	return jQuery.parseXML(string);
};




/* Actual tests */

test("element", function() {
	expect( 35 );

	equal( Sizzle("").length, 0, "Empty selector returns an empty array" );
	equal( Sizzle(" ").length, 0, "Empty selector returns an empty array" );
	equal( Sizzle("\t").length, 0, "Empty selector returns an empty array" );
	var form = document.getElementById("form");
	ok( !Sizzle.matchesSelector( form, "" ), "Empty string passed to matchesSelector does not match" );

	ok( Sizzle("*").length >= 30, "Select all" );
	var all = Sizzle("*"), good = true;
	for ( var i = 0; i < all.length; i++ ) {
		if ( all[i].nodeType == 8 ) {
			good = false;
		}
	}
	ok( good, "Select all elements, no comment nodes" );
	t( "Element Selector", "html", ["html"] );
	t( "Element Selector", "body", ["body"] );
	t( "Element Selector", "#qunit-fixture p", ["firstp","ap","sndp","en","sap","first"] );

	t( "Leading space", " #qunit-fixture p", ["firstp","ap","sndp","en","sap","first"] );
	t( "Leading tab", "\t#qunit-fixture p", ["firstp","ap","sndp","en","sap","first"] );
	t( "Leading carriage return", "\r#qunit-fixture p", ["firstp","ap","sndp","en","sap","first"] );
	t( "Leading line feed", "\n#qunit-fixture p", ["firstp","ap","sndp","en","sap","first"] );
	t( "Leading form feed", "\f#qunit-fixture p", ["firstp","ap","sndp","en","sap","first"] );
	t( "Trailing space", "#qunit-fixture p ", ["firstp","ap","sndp","en","sap","first"] );
	t( "Trailing tab", "#qunit-fixture p\t", ["firstp","ap","sndp","en","sap","first"] );
	t( "Trailing carriage return", "#qunit-fixture p\r", ["firstp","ap","sndp","en","sap","first"] );
	t( "Trailing line feed", "#qunit-fixture p\n", ["firstp","ap","sndp","en","sap","first"] );
	t( "Trailing form feed", "#qunit-fixture p\f", ["firstp","ap","sndp","en","sap","first"] );

	t( "Parent Element", "div p", ["firstp","ap","sndp","en","sap","first"] );
	t( "Parent Element (non-space descendant combinator)", "div\tp", ["firstp","ap","sndp","en","sap","first"] );
	var obj1 = document.getElementById("object1");
	equal( Sizzle("param", obj1).length, 2, "Object/param as context" );

	deepEqual( Sizzle("select", form), q("select1","select2","select3","select4","select5"), "Finding selects with a context." );

	// Check for unique-ness and sort order
	deepEqual( Sizzle("p, div p"), Sizzle("p"), "Check for duplicates: p, div p" );

	t( "Checking sort order", "h2, h1", ["qunit-header", "qunit-banner", "qunit-userAgent"] );
	t( "Checking sort order", "h2:first, h1:first", ["qunit-header", "qunit-banner"] );
	t( "Checking sort order", "#qunit-fixture p, #qunit-fixture p a", ["firstp", "simon1", "ap", "google", "groups", "anchor1", "mark", "sndp", "en", "yahoo", "sap", "anchor2", "simon", "first"] );

	// Test Conflict ID
	var lengthtest = document.getElementById("lengthtest");
	deepEqual( Sizzle("#idTest", lengthtest), q("idTest"), "Finding element with id of ID." );
	deepEqual( Sizzle("[name='id']", lengthtest), q("idTest"), "Finding element with id of ID." );
	deepEqual( Sizzle("input[id='idTest']", lengthtest), q("idTest"), "Finding elements with id of ID." );

	var siblingTest = document.getElementById("siblingTest");
	deepEqual( Sizzle("div em", siblingTest), [], "Element-rooted QSA does not select based on document context" );
	deepEqual( Sizzle("div em, div em, div em:not(div em)", siblingTest), [], "Element-rooted QSA does not select based on document context" );
	deepEqual( Sizzle("div em, em\\,", siblingTest), [], "Escaped commas do not get treated with an id in element-rooted QSA" );

	var html = "";
	for ( i = 0; i < 100; i++ ) {
		html = "<div>" + html + "</div>";
	}
	html = jQuery( html ).appendTo( document.body );
	ok( !!Sizzle("body div div div").length, "No stack or performance problems with large amounts of descendents" );
	ok( !!Sizzle("body>div div div").length, "No stack or performance problems with large amounts of descendents" );
	html.remove();
});

test("XML Document Selectors", function() {
	var xml = createWithFriesXML();
	expect( 10 );

	equal( Sizzle("foo_bar", xml).length, 1, "Element Selector with underscore" );
	equal( Sizzle(".component", xml).length, 1, "Class selector" );
	equal( Sizzle("[class*=component]", xml).length, 1, "Attribute selector for class" );
	equal( Sizzle("property[name=prop2]", xml).length, 1, "Attribute selector with name" );
	equal( Sizzle("[name=prop2]", xml).length, 1, "Attribute selector with name" );
	equal( Sizzle("#seite1", xml).length, 1, "Attribute selector with ID" );
	equal( Sizzle("component#seite1", xml).length, 1, "Attribute selector with ID" );
	equal( Sizzle.matches( "#seite1", Sizzle("component", xml) ).length, 1, "Attribute selector filter with ID" );
	equal( Sizzle("meta property thing", xml).length, 2, "Descendent selector and dir caching" );
	ok( Sizzle.matchesSelector( xml.lastChild, "soap\\:Envelope" ), "Check for namespaced element" );
});

test("broken", function() {
	expect( 21 );

	function broken( name, selector ) {
		raises(function() {
			Sizzle( selector );
		}, function( e ) {
			return e.message.indexOf("Syntax error") >= 0;
		}, name + ": " + selector );
	}

	broken( "Broken Selector", "[" );
	broken( "Broken Selector", "(" );
	broken( "Broken Selector", "{" );
	broken( "Broken Selector", "<" );
	broken( "Broken Selector", "()" );
	broken( "Broken Selector", "<>" );
	broken( "Broken Selector", "{}" );
	broken( "Broken Selector", "," );
	broken( "Broken Selector", ",a" );
	// Hangs on IE 9 if regular expression is inefficient
	broken( "Broken Selector", "[id=012345678901234567890123456789");
	broken( "Doesn't exist", ":visble" );
	broken( "Nth-child", ":nth-child" );
	// Sigh again. IE 9 thinks this is also a real selector
	// not super critical that we fix this case
	//broken( "Nth-child", ":nth-child(-)" );
	// Sigh. WebKit thinks this is a real selector in qSA
	// They've already fixed this and it'll be coming into
	// current browsers soon. Currently, Safari 5.0 still has this problem
	// broken( "Nth-child", ":nth-child(asdf)", [] );
	broken( "Nth-child", ":nth-child(2n+-0)" );
	broken( "Nth-child", ":nth-child(2+0)" );
	broken( "Nth-child", ":nth-child(- 1n)" );
	broken( "Nth-child", ":nth-child(-1 n)" );
	broken( "First-child", ":first-child(n)" );
	broken( "Last-child", ":last-child(n)" );
	broken( "Only-child", ":only-child(n)" );

	// Make sure attribute value quoting works correctly. See: #6093
	var attrbad = jQuery('<input type="hidden" value="2" name="foo.baz" id="attrbad1"/><input type="hidden" value="2" name="foo[baz]" id="attrbad2"/>').appendTo("body");

	broken( "Attribute not escaped", "input[name=foo.baz]", [] );
	// Shouldn't be matching those inner brackets
	broken( "Attribute not escaped", "input[name=foo[baz]]", [] );

	attrbad.remove();
});

test("id", function() {
	expect( 31 );

	t( "ID Selector", "#body", ["body"] );
	t( "ID Selector w/ Element", "body#body", ["body"] );
	t( "ID Selector w/ Element", "ul#first", [] );
	t( "ID selector with existing ID descendant", "#firstp #simon1", ["simon1"] );
	t( "ID selector with non-existant descendant", "#firstp #foobar", [] );
	t( "ID selector using UTF8", "#台北Táiběi", ["台北Táiběi"] );
	t( "Multiple ID selectors using UTF8", "#台北Táiběi, #台北", ["台北Táiběi","台北"] );
	t( "Descendant ID selector using UTF8", "div #台北", ["台北"] );
	t( "Child ID selector using UTF8", "form > #台北", ["台北"] );

	t( "Escaped ID", "#foo\\:bar", ["foo:bar"] );
	t( "Escaped ID with descendent", "#foo\\:bar span:not(:input)", ["foo_descendent"] );
	t( "Escaped ID", "#test\\.foo\\[5\\]bar", ["test.foo[5]bar"] );
	t( "Descendant escaped ID", "div #foo\\:bar", ["foo:bar"] );
	t( "Descendant escaped ID", "div #test\\.foo\\[5\\]bar", ["test.foo[5]bar"] );
	t( "Child escaped ID", "form > #foo\\:bar", ["foo:bar"] );
	t( "Child escaped ID", "form > #test\\.foo\\[5\\]bar", ["test.foo[5]bar"] );

	var fiddle = jQuery("<div id='fiddle\\Foo'><span id='fiddleSpan'></span></div>").appendTo("#qunit-fixture");
	deepEqual( Sizzle( "> span", Sizzle("#fiddle\\\\Foo")[0] ), q([ "fiddleSpan" ]), "Escaped ID as context" );
	fiddle.remove();

	t( "ID Selector, child ID present", "#form > #radio1", ["radio1"] ); // bug #267
	t( "ID Selector, not an ancestor ID", "#form #first", [] );
	t( "ID Selector, not a child ID", "#form > #option1a", [] );

	t( "All Children of ID", "#foo > *", ["sndp", "en", "sap"] );
	t( "All Children of ID with no children", "#firstUL > *", [] );

	var a = jQuery("<div><a name=\"tName1\">tName1 A</a><a name=\"tName2\">tName2 A</a><div id=\"tName1\">tName1 Div</div></div>").appendTo("#qunit-fixture");
	equal( Sizzle("#tName1")[0].id, 'tName1', "ID selector with same value for a name attribute" );
	equal( Sizzle("#tName2").length, 0, "ID selector non-existing but name attribute on an A tag" );
	a.remove();

	a = jQuery("<a id='backslash\\foo'></a>").appendTo("#qunit-fixture");
	t( "ID Selector contains backslash", "#backslash\\\\foo", ["backslash\\foo"] );

	t( "ID Selector on Form with an input that has a name of 'id'", "#lengthtest", ["lengthtest"] );

	t( "ID selector with non-existant ancestor", "#asdfasdf #foobar", [] ); // bug #986

	deepEqual( Sizzle("div#form", document.body), [], "ID selector within the context of another element" );

	t( "Underscore ID", "#types_all", ["types_all"] );
	t( "Dash ID", "#fx-queue", ["fx-queue"] );

	t( "ID with weird characters in it", "#name\\+value", ["name+value"] );
});

test("class", function() {
	expect( 24 );

	t( "Class Selector", ".blog", ["mark","simon"] );
	t( "Class Selector", ".GROUPS", ["groups"] );
	t( "Class Selector", ".blog.link", ["simon"] );
	t( "Class Selector w/ Element", "a.blog", ["mark","simon"] );
	t( "Parent Class Selector", "p .blog", ["mark","simon"] );

	t( "Class selector using UTF8", ".台北Táiběi", ["utf8class1"] );
	//t( "Class selector using UTF8", ".台北", ["utf8class1","utf8class2"] );
	t( "Class selector using UTF8", ".台北Táiběi.台北", ["utf8class1"] );
	t( "Class selector using UTF8", ".台北Táiběi, .台北", ["utf8class1","utf8class2"] );
	t( "Descendant class selector using UTF8", "div .台北Táiběi", ["utf8class1"] );
	t( "Child class selector using UTF8", "form > .台北Táiběi", ["utf8class1"] );

	t( "Escaped Class", ".foo\\:bar", ["foo:bar"] );
	t( "Escaped Class", ".test\\.foo\\[5\\]bar", ["test.foo[5]bar"] );
	t( "Descendant scaped Class", "div .foo\\:bar", ["foo:bar"] );
	t( "Descendant scaped Class", "div .test\\.foo\\[5\\]bar", ["test.foo[5]bar"] );
	t( "Child escaped Class", "form > .foo\\:bar", ["foo:bar"] );
	t( "Child escaped Class", "form > .test\\.foo\\[5\\]bar", ["test.foo[5]bar"] );

	var div = document.createElement("div");
	div.innerHTML = "<div class='test e'></div><div class='test'></div>";
	deepEqual( Sizzle(".e", div), [ div.firstChild ], "Finding a second class." );

	div.lastChild.className = "e";

	deepEqual( Sizzle(".e", div), [ div.firstChild, div.lastChild ], "Finding a modified class." );

	ok( !Sizzle.matchesSelector( div, ".null"), ".null does not match an element with no class" );
	ok( !Sizzle.matchesSelector( div.firstChild, ".null div"), ".null does not match an element with no class" );
	div.className = "null";
	ok( Sizzle.matchesSelector( div, ".null"), ".null matches element with class 'null'" );
	ok( Sizzle.matchesSelector( div.firstChild, ".null div"), "caching system respects DOM changes" );
	ok( !Sizzle.matchesSelector( document, ".foo" ), "testing class on document doesn't error" );
	ok( !Sizzle.matchesSelector( window, ".foo" ), "testing class on window doesn't error" );
});

test("name", function() {
	expect( 15 );

	t( "Name selector", "input[name=action]", ["text1"] );
	t( "Name selector with single quotes", "input[name='action']", ["text1"] );
	t( "Name selector with double quotes", 'input[name="action"]', ["text1"] );

	t( "Name selector non-input", "[name=test]", ["length", "fx-queue"] );
	t( "Name selector non-input", "[name=div]", ["fadein"] );
	t( "Name selector non-input", "*[name=iframe]", ["iframe"] );

	t( "Name selector for grouped input", "input[name='types[]']", ["types_all", "types_anime", "types_movie"] );

	var form = document.getElementById("form");
	deepEqual( Sizzle("input[name=action]", form), q("text1"), "Name selector within the context of another element" );
	deepEqual( Sizzle("input[name='foo[bar]']", form), q("hidden2"), "Name selector for grouped form element within the context of another element" );

	form = jQuery("<form><input name='id'/></form>").appendTo("body");
	equal( Sizzle("input", form[0]).length, 1, "Make sure that rooted queries on forms (with possible expandos) work." );

	form.remove();

	var a = jQuery("<div><a id=\"tName1ID\" name=\"tName1\">tName1 A</a><a id=\"tName2ID\" name=\"tName2\">tName2 A</a><div id=\"tName1\">tName1 Div</div></div>")
		.appendTo("#qunit-fixture").children();

	equal( a.length, 3, "Make sure the right number of elements were inserted." );
	equal( a[1].id, "tName2ID", "Make sure the right number of elements were inserted." );

	equal( Sizzle("[name=tName1]")[0], a[0], "Find elements that have similar IDs" );
	equal( Sizzle("[name=tName2]")[0], a[1], "Find elements that have similar IDs" );
	t( "Find elements that have similar IDs", "#tName2ID", ["tName2ID"] );

	a.parent().remove();
});

test("multiple", function() {
	expect(6);

	t( "Comma Support", "h2, #qunit-fixture p", ["qunit-banner","qunit-userAgent","firstp","ap","sndp","en","sap","first"]);
	t( "Comma Support", "h2 , #qunit-fixture p", ["qunit-banner","qunit-userAgent","firstp","ap","sndp","en","sap","first"]);
	t( "Comma Support", "h2 , #qunit-fixture p", ["qunit-banner","qunit-userAgent","firstp","ap","sndp","en","sap","first"]);
	t( "Comma Support", "h2,#qunit-fixture p", ["qunit-banner","qunit-userAgent","firstp","ap","sndp","en","sap","first"]);
	t( "Comma Support", "h2,#qunit-fixture p ", ["qunit-banner","qunit-userAgent","firstp","ap","sndp","en","sap","first"]);
	t( "Comma Support", "h2\t,\r#qunit-fixture p\n", ["qunit-banner","qunit-userAgent","firstp","ap","sndp","en","sap","first"]);
});

test("child and adjacent", function() {
	expect( 42 );

	t( "Child", "p > a", ["simon1","google","groups","mark","yahoo","simon"] );
	t( "Child", "p> a", ["simon1","google","groups","mark","yahoo","simon"] );
	t( "Child", "p >a", ["simon1","google","groups","mark","yahoo","simon"] );
	t( "Child", "p>a", ["simon1","google","groups","mark","yahoo","simon"] );
	t( "Child w/ Class", "p > a.blog", ["mark","simon"] );
	t( "All Children", "code > *", ["anchor1","anchor2"] );
	t( "All Grandchildren", "p > * > *", ["anchor1","anchor2"] );
	t( "Adjacent", "#qunit-fixture a + a", ["groups"] );
	t( "Adjacent", "#qunit-fixture a +a", ["groups"] );
	t( "Adjacent", "#qunit-fixture a+ a", ["groups"] );
	t( "Adjacent", "#qunit-fixture a+a", ["groups"] );
	t( "Adjacent", "p + p", ["ap","en","sap"] );
	t( "Adjacent", "p#firstp + p", ["ap"] );
	t( "Adjacent", "p[lang=en] + p", ["sap"] );
	t( "Adjacent", "a.GROUPS + code + a", ["mark"] );
	t( "Comma, Child, and Adjacent", "#qunit-fixture a + a, code > a", ["groups","anchor1","anchor2"] );
	t( "Element Preceded By", "#qunit-fixture p ~ div", ["foo", "moretests","tabindex-tests", "liveHandlerOrder", "siblingTest"] );
	t( "Element Preceded By", "#first ~ div", ["moretests","tabindex-tests", "liveHandlerOrder", "siblingTest"] );
	t( "Element Preceded By", "#groups ~ a", ["mark"] );
	t( "Element Preceded By", "#length ~ input", ["idTest"] );
	t( "Element Preceded By", "#siblingfirst ~ em", ["siblingnext", "siblingthird"] );
	t( "Element Preceded By (multiple)", "#siblingTest em ~ em ~ em ~ span", ["siblingspan"] );
	t( "Element Preceded By, Containing", "#liveHandlerOrder ~ div em:contains('1')", ["siblingfirst"] );

	var siblingFirst = document.getElementById("siblingfirst");

	deepEqual( Sizzle("~ em", siblingFirst), q("siblingnext", "siblingthird"), "Element Preceded By with a context." );
	deepEqual( Sizzle("+ em", siblingFirst), q("siblingnext"), "Element Directly Preceded By with a context." );
	deepEqual( Sizzle("~ em:first", siblingFirst), q("siblingnext"), "Element Preceded By positional with a context." );

	var en = document.getElementById("en");
	deepEqual( Sizzle("+ p, a", en), q("yahoo", "sap"), "Compound selector with context, beginning with sibling test." );
	deepEqual( Sizzle("a, + p", en), q("yahoo", "sap"), "Compound selector with context, containing sibling test." );

	t( "Multiple combinators selects all levels", "#siblingTest em *", ["siblingchild", "siblinggrandchild", "siblinggreatgrandchild"] );
	t( "Multiple combinators selects all levels", "#siblingTest > em *", ["siblingchild", "siblinggrandchild", "siblinggreatgrandchild"] );
	t( "Multiple sibling combinators doesn't miss general siblings", "#siblingTest > em:first-child + em ~ span", ["siblingspan"] );
	t( "Combinators are not skipped when mixing general and specific", "#siblingTest > em:contains('x') + em ~ span", [] );

	equal( Sizzle("#listWithTabIndex").length, 1, "Parent div for next test is found via ID (#8310)" );
	equal( Sizzle("#listWithTabIndex li:eq(2) ~ li").length, 1, "Find by general sibling combinator (#8310)" );
	equal( Sizzle("#__sizzle__").length, 0, "Make sure the temporary id assigned by sizzle is cleared out (#8310)" );
	equal( Sizzle("#listWithTabIndex").length, 1, "Parent div for previous test is still found via ID (#8310)" );

	t( "Verify deep class selector", "div.blah > p > a", [] );

	t( "No element deep selector", "div.foo > span > a", [] );

	var nothiddendiv = document.getElementById("nothiddendiv");
	deepEqual( Sizzle("> :first", nothiddendiv), q("nothiddendivchild"), "Verify child context positional selector" );
	deepEqual( Sizzle("> :eq(0)", nothiddendiv), q("nothiddendivchild"), "Verify child context positional selector" );
	deepEqual( Sizzle("> *:first", nothiddendiv), q("nothiddendivchild"), "Verify child context positional selector" );

	t( "Non-existant ancestors", ".fototab > .thumbnails > a", [] );
});

test("attributes", function() {
	expect( 61 );

	t( "Attribute Exists", "#qunit-fixture a[title]", ["google"] );
	t( "Attribute Exists (case-insensitive)", "#qunit-fixture a[TITLE]", ["google"] );
	t( "Attribute Exists", "#qunit-fixture *[title]", ["google"] );
	t( "Attribute Exists", "#qunit-fixture [title]", ["google"] );
	t( "Attribute Exists", "#qunit-fixture a[ title ]", ["google"] );

	t( "Boolean attribute exists", "#select2 option[selected]", ["option2d"]);
	t( "Boolean attribute equals", "#select2 option[selected='selected']", ["option2d"]);

	t( "Attribute Equals", "#qunit-fixture a[rel='bookmark']", ["simon1"] );
	t( "Attribute Equals", "#qunit-fixture a[rel='bookmark']", ["simon1"] );
	t( "Attribute Equals", "#qunit-fixture a[rel=bookmark]", ["simon1"] );
	t( "Attribute Equals", "#qunit-fixture a[href='http://www.google.com/']", ["google"] );
	t( "Attribute Equals", "#qunit-fixture a[ rel = 'bookmark' ]", ["simon1"] );
	t( "Attribute Equals Number", "#qunit-fixture option[value=1]", ["option1b","option2b","option3b","option4b","option5c"] );
	t( "Attribute Equals Number", "#qunit-fixture li[tabIndex=-1]", ["foodWithNegativeTabIndex"] );

	document.getElementById("anchor2").href = "#2";
	t( "href Attribute", "p a[href^=#]", ["anchor2"] );
	t( "href Attribute", "p a[href*=#]", ["simon1", "anchor2"] );

	t( "for Attribute", "form label[for]", ["label-for"] );
	t( "for Attribute in form", "#form [for=action]", ["label-for"] );

	t( "Attribute containing []", "input[name^='foo[']", ["hidden2"] );
	t( "Attribute containing []", "input[name^='foo[bar]']", ["hidden2"] );
	t( "Attribute containing []", "input[name*='[bar]']", ["hidden2"] );
	t( "Attribute containing []", "input[name$='bar]']", ["hidden2"] );
	t( "Attribute containing []", "input[name$='[bar]']", ["hidden2"] );
	t( "Attribute containing []", "input[name$='foo[bar]']", ["hidden2"] );
	t( "Attribute containing []", "input[name*='foo[bar]']", ["hidden2"] );

	deepEqual( Sizzle( "input[data-comma='0,1']" ), [ document.getElementById("el12087") ], "Without context, single-quoted attribute containing ','" );
	deepEqual( Sizzle( 'input[data-comma="0,1"]' ), [ document.getElementById("el12087") ], "Without context, double-quoted attribute containing ','" );
	deepEqual( Sizzle( "input[data-comma='0,1']", document.getElementById("t12087") ), [ document.getElementById("el12087") ], "With context, single-quoted attribute containing ','" );
	deepEqual( Sizzle( 'input[data-comma="0,1"]', document.getElementById("t12087") ), [ document.getElementById("el12087") ], "With context, double-quoted attribute containing ','" );

	t( "Multiple Attribute Equals", "#form input[type='radio'], #form input[type='hidden']", ["radio1", "radio2", "hidden1"] );
	t( "Multiple Attribute Equals", "#form input[type='radio'], #form input[type=\"hidden\"]", ["radio1", "radio2", "hidden1"] );
	t( "Multiple Attribute Equals", "#form input[type='radio'], #form input[type=hidden]", ["radio1", "radio2", "hidden1"] );

	t( "Attribute selector using UTF8", "span[lang=中文]", ["台北"] );

	t( "Attribute Begins With", "a[href ^= 'http://www']", ["google","yahoo"] );
	t( "Attribute Ends With", "a[href $= 'org/']", ["mark"] );
	t( "Attribute Contains", "a[href *= 'google']", ["google","groups"] );
	t( "Attribute Is Not Equal", "#ap a[hreflang!='en']", ["google","groups","anchor1"] );

	var opt = document.getElementById("option1a"),
		match = Sizzle.matchesSelector;

	opt.setAttribute( "test", "" );

	ok( match( opt, "[id*=option1][type!=checkbox]" ), "Attribute Is Not Equal Matches" );
	ok( match( opt, "[id*=option1]" ), "Attribute With No Quotes Contains Matches" );
	ok( match( opt, "[test=]" ), "Attribute With No Quotes No Content Matches" );
	ok( !match( opt, "[test^='']" ), "Attribute with empty string value does not match startsWith selector (^=)" );
	ok( match( opt, "[id=option1a]" ), "Attribute With No Quotes Equals Matches" );
	ok( match( document.getElementById("simon1"), "a[href*=#]" ), "Attribute With No Quotes Href Contains Matches" );

	t( "Empty values", "#select1 option[value='']", ["option1a"] );
	t( "Empty values", "#select1 option[value!='']", ["option1b","option1c","option1d"] );

	t( "Select options via :selected", "#select1 option:selected", ["option1a"] );
	t( "Select options via :selected", "#select2 option:selected", ["option2d"] );
	t( "Select options via :selected", "#select3 option:selected", ["option3b", "option3c"] );
	t( "Select options via :selected", "select[name='select2'] option:selected", ["option2d"] );

	t( "Grouped Form Elements", "input[name='foo[bar]']", ["hidden2"] );

	var a = document.getElementById("groups"),
		title = "Don't click me";
	a.title = title;
	ok( match( a, "a[title=\"Don't click me\"]" ), "Quote within attribute value does not mess up tokenizer" );

	// Uncomment if the boolHook is removed
	// var check2 = document.getElementById("check2");
	// check2.checked = true;
	// ok( !Sizzle.matches("[checked]", [ check2 ] ), "Dynamic boolean attributes match when they should with Sizzle.matches (#11115)" );

	a.setAttribute( "data-pos", ":first" );
	ok( match( a, "a[data-pos=\\:first]"), "POS within attribute value is treated as an attribute value" );
	ok( match( a, "a[data-pos=':first']"), "POS within attribute value is treated as an attribute value" );
	a.removeAttribute("data-pos");

	// Make sure attribute value quoting works correctly. See: #6093
	var attrbad = jQuery("<input type=\"hidden\" value=\"2\" name=\"foo.baz\" id=\"attrbad1\"/><input type=\"hidden\" value=\"2\" name=\"foo[baz]\" id=\"attrbad2\"/><input type=\"hidden\" data-attr=\"foo_baz']\" id=\"attrbad3\"/>").appendTo("body");

	t( "Underscores are valid unquoted", "input[id=types_all]", ["types_all"] );

	t( "Find escaped attribute value", "input[name=foo\\.baz]", ["attrbad1"] );
	t( "Find escaped attribute value", "input[name=foo\\[baz\\]]", ["attrbad2"] );
	t( "Find escaped attribute value", "input[data-attr='foo_baz\\']']", ["attrbad3"] );

	t( "input[type=text]", "#form input[type=text]", ["text1", "text2", "hidden2", "name"] );
	t( "input[type=search]", "#form input[type=search]", ["search"] );

	attrbad.remove();

	// #6428
	t( "Find escaped attribute value", "#form input[name=foo\\[bar\\]]", ["hidden2"] );

	// #3279
	var div = document.createElement("div");
	div.innerHTML = "<div id='foo' xml:test='something'></div>";

	deepEqual( Sizzle( "[xml\\:test]", div ), [ div.firstChild ], "Finding by attribute with escaped characters." );
	div = null;
});

test("pseudo - child", function() {
	expect( 41 );
	t( "First Child", "#qunit-fixture p:first-child", ["firstp","sndp"] );
	t( "First Child (case-insensitive)", "#qunit-fixture p:FIRST-CHILD", ["firstp","sndp"] );
	t( "Last Child", "p:last-child", ["sap"] );
	t( "Only Child", "#qunit-fixture a:only-child", ["simon1","anchor1","yahoo","anchor2","liveLink1","liveLink2"] );
	t( "Empty", "ul:empty", ["firstUL"] );
	t( "Empty with comment node", "ol:empty", ["empty"] );
	t( "Is A Parent", "#qunit-fixture p:parent", ["firstp","ap","sndp","en","sap","first"] );

	t( "First Child", "p:first-child", ["firstp","sndp"] );
	t( "First Child", ".nothiddendiv div:first-child", ["nothiddendivchild"] );
	t( "Nth Child", "p:nth-child(1)", ["firstp","sndp"] );
	t( "Nth Child With Whitespace", "p:nth-child( 1 )", ["firstp","sndp"] );
	t( "Not Nth Child", "#qunit-fixture p:not(:nth-child(1))", ["ap","en","sap","first"] );

	// Verify that the child position isn't being cached improperly
	jQuery("p:first-child").after("<div></div>");
	jQuery("p:first-child").before("<div></div>").next().remove();

	t( "First Child", "p:first-child", [] );

	QUnit.reset();

	t( "Last Child", "p:last-child", ["sap"] );
	t( "Last Child", "#qunit-fixture a:last-child", ["simon1","anchor1","mark","yahoo","anchor2","simon","liveLink1","liveLink2"] );

	t( "Nth-child", "#qunit-fixture form#form > *:nth-child(2)", ["text1"] );
	t( "Nth-child", "#qunit-fixture form#form > :nth-child(2)", ["text1"] );

	t( "Nth-child", "#form select:first option:nth-child(-1)", [] );
	t( "Nth-child", "#form select:first option:nth-child(3)", ["option1c"] );
	t( "Nth-child(case-insensitive)", "#form select:first option:NTH-child(3)", ["option1c"] );
	t( "Nth-child", "#form select:first option:nth-child(0n+3)", ["option1c"] );
	t( "Nth-child", "#form select:first option:nth-child(1n+0)", ["option1a", "option1b", "option1c", "option1d"] );
	t( "Nth-child", "#form select:first option:nth-child(1n)", ["option1a", "option1b", "option1c", "option1d"] );
	t( "Nth-child", "#form select:first option:nth-child(n)", ["option1a", "option1b", "option1c", "option1d"] );
	t( "Nth-child", "#form select:first option:nth-child(even)", ["option1b", "option1d"] );
	t( "Nth-child", "#form select:first option:nth-child(odd)", ["option1a", "option1c"] );
	t( "Nth-child", "#form select:first option:nth-child(2n)", ["option1b", "option1d"] );
	t( "Nth-child", "#form select:first option:nth-child(2n+1)", ["option1a", "option1c"] );
	t( "Nth-child", "#form select:first option:nth-child(2n + 1)", ["option1a", "option1c"] );
	t( "Nth-child", "#form select:first option:nth-child(+2n + 1)", ["option1a", "option1c"] );
	t( "Nth-child", "#form select:first option:nth-child(3n)", ["option1c"] );
	t( "Nth-child", "#form select:first option:nth-child(3n+1)", ["option1a", "option1d"] );
	t( "Nth-child", "#form select:first option:nth-child(3n+2)", ["option1b"] );
	t( "Nth-child", "#form select:first option:nth-child(3n+3)", ["option1c"] );
	t( "Nth-child", "#form select:first option:nth-child(3n-1)", ["option1b"] );
	t( "Nth-child", "#form select:first option:nth-child(3n-2)", ["option1a", "option1d"] );
	t( "Nth-child", "#form select:first option:nth-child(3n-3)", ["option1c"] );
	t( "Nth-child", "#form select:first option:nth-child(3n+0)", ["option1c"] );
	t( "Nth-child", "#form select:first option:nth-child(-1n+3)", ["option1a", "option1b", "option1c"] );
	t( "Nth-child", "#form select:first option:nth-child(-n+3)", ["option1a", "option1b", "option1c"] );
	t( "Nth-child", "#form select:first option:nth-child(-1n + 3)", ["option1a", "option1b", "option1c"] );
});

test("pseudo - misc", function() {
	expect( 38 );

	t( "Headers", ":header", ["qunit-header", "qunit-banner", "qunit-userAgent"] );
	t( "Headers(case-insensitive)", ":Header", ["qunit-header", "qunit-banner", "qunit-userAgent"] );
	t( "Has Children - :has()", "p:has(a)", ["firstp","ap","en","sap"] );
	t( "Has Children - :has()", "p:has( a )", ["firstp","ap","en","sap"] );
	t( "Multiple matches with the same context (cache check)", "#form select:has(option:first-child:contains('o'))", ["select1", "select2", "select3", "select4"] );

	ok( Sizzle("#qunit-fixture :not(:has(:has(*)))").length, "All not grandparents" );

	var select = document.getElementById("select1"),
		match = Sizzle.matchesSelector;
	ok( match( select, ":has(option)" ), "Has Option Matches" );

	t( "Text Contains", "a:contains(Google)", ["google","groups"] );
	t( "Text Contains", "a:contains(Google Groups)", ["groups"] );

	t( "Text Contains", "a:contains('Google Groups (Link)')", ["groups"] );
	t( "Text Contains", "a:contains(\"(Link)\")", ["groups"] );
	t( "Text Contains", "a:contains(Google Groups (Link))", ["groups"] );
	t( "Text Contains", "a:contains((Link))", ["groups"] );


	var tmp = document.createElement("div");
	tmp.id = "tmp_input";
	document.body.appendChild( tmp );

	jQuery.each( [ "button", "submit", "reset" ], function( i, type ) {
		jQuery( tmp ).append(
			"<input id='input_T' type='T'/><button id='button_T' type='T'>test</button>".replace(/T/g, type) );

		t( "Input Buttons :" + type, "#tmp_input :" + type, [ "input_" + type, "button_" + type ] );

		ok( match( Sizzle("#input_" + type)[0], ":" + type ), "Input Matches :" + type );
		ok( match( Sizzle("#button_" + type)[0], ":" + type ), "Button Matches :" + type );
	});

	document.body.removeChild( tmp );

	var input = document.createElement("input");
	input.type = "text";
	input.id = "focus-input";

	document.body.appendChild( input );
	input.focus();

	// Inputs can't be focused unless the document has focus
	if ( document.activeElement !== input || (document.hasFocus && !document.hasFocus()) ||
		(document.querySelectorAll && !document.querySelectorAll("input:focus").length) ) {
		ok( true, "The input was not focused. Skip checking the :focus match." );
		ok( true, "The input was not focused. Skip checking the :focus match." );

	} else {
		t( "Element focused", "input:focus", [ "focus-input" ] );
		ok( match( input, ":focus" ), ":focus Matches" );
	}

	// :active selector: this selector does not depend on document focus
	if ( document.activeElement === input ) {
		ok( match( input, ":active" ), ":active Matches" );
	} else {
		ok( true, "The input did not become active. Skip checking the :active match." );
	}

	input.blur();

	// When IE is out of focus, blur does not work. Force it here.
	if ( document.activeElement === input ) {
		document.body.focus();
	}

	ok( !match( input, ":focus" ), ":focus doesn't match" );
	ok( !match( input, ":active" ), ":active doesn't match" );
	document.body.removeChild( input );

	// Tokenization edge cases
	t( "Sequential pseudos", "#qunit-fixture p:has(:contains(mark)):has(code)", ["ap"] );
	t( "Sequential pseudos", "#qunit-fixture p:has(:contains(mark)):has(code):contains(This link)", ["ap"] );

	t( "Pseudo argument containing ')'", "p:has(>a.GROUPS[src!=')'])", ["ap"] );
	t( "Pseudo argument containing ')'", "p:has(>a.GROUPS[src!=')'])", ["ap"] );
	t( "Pseudo followed by token containing ')'", "p:contains(id=\"foo\")[id!=\\)]", ["sndp"] );
	t( "Pseudo followed by token containing ')'", "p:contains(id=\"foo\")[id!=')']", ["sndp"] );

	t( "Multi-pseudo", "#ap:has(*), #ap:has(*)", ["ap"] );
	t( "Multi-positional", "#ap:gt(0), #ap:lt(1)", ["ap"] );
	t( "Multi-pseudo with leading nonexistent id", "#nonexistent:has(*), #ap:has(*)", ["ap"] );
	t( "Multi-positional with leading nonexistent id", "#nonexistent:gt(0), #ap:lt(1)", ["ap"] );

	Sizzle.selectors.pseudos.icontains = function( elem, i, match ) {
		return Sizzle.getText( elem ).toLowerCase().indexOf( (match[3] || "").toLowerCase() ) > -1;
	};
	t( "Backwards-compatible custom pseudos", "a:icontains(THIS BLOG ENTRY)", ["simon1"] );
	delete Sizzle.selectors.pseudos.icontains;
});


test("pseudo - :not", function() {
	expect( 33 );

	t( "Not", "a.blog:not(.link)", ["mark"] );
	t( ":not() with :first", "#foo p:not(:first) .link", ["simon"] );

	t( "Not - multiple", "#form option:not(:contains(Nothing),#option1b,:selected)", ["option1c", "option1d", "option2b", "option2c", "option3d", "option3e", "option4e", "option5b", "option5c"] );
	t( "Not - recursive", "#form option:not(:not(:selected))[id^='option3']", [ "option3b", "option3c"] );

	t( ":not() failing interior", "#qunit-fixture p:not(.foo)", ["firstp","ap","sndp","en","sap","first"] );
	t( ":not() failing interior", "#qunit-fixture p:not(div.foo)", ["firstp","ap","sndp","en","sap","first"] );
	t( ":not() failing interior", "#qunit-fixture p:not(p.foo)", ["firstp","ap","sndp","en","sap","first"] );
	t( ":not() failing interior", "#qunit-fixture p:not(#blargh)", ["firstp","ap","sndp","en","sap","first"] );
	t( ":not() failing interior", "#qunit-fixture p:not(div#blargh)", ["firstp","ap","sndp","en","sap","first"] );
	t( ":not() failing interior", "#qunit-fixture p:not(p#blargh)", ["firstp","ap","sndp","en","sap","first"] );

	t( ":not Multiple", "#qunit-fixture p:not(a)", ["firstp","ap","sndp","en","sap","first"] );
	t( ":not Multiple", "#qunit-fixture p:not( a )", ["firstp","ap","sndp","en","sap","first"] );
	t( ":not Multiple", "#qunit-fixture p:not( p )", [] );
	t( ":not Multiple", "#qunit-fixture p:not(a, b)", ["firstp","ap","sndp","en","sap","first"] );
	t( ":not Multiple", "#qunit-fixture p:not(a, b, div)", ["firstp","ap","sndp","en","sap","first"] );
	t( ":not Multiple", "p:not(p)", [] );
	t( ":not Multiple", "p:not(a,p)", [] );
	t( ":not Multiple", "p:not(p,a)", [] );
	t( ":not Multiple", "p:not(a,p,b)", [] );
	t( ":not Multiple", ":input:not(:image,:input,:submit)", [] );
	t( ":not Multiple", "#qunit-fixture p:not(:has(a), :nth-child(1))", ["first"] );

	t( "No element not selector", ".container div:not(.excluded) div", [] );

	t( ":not() Existing attribute", "#form select:not([multiple])", ["select1", "select2", "select5"]);
	t( ":not() Equals attribute", "#form select:not([name=select1])", ["select2", "select3", "select4","select5"]);
	t( ":not() Equals quoted attribute", "#form select:not([name='select1'])", ["select2", "select3", "select4", "select5"]);

	t( ":not() Multiple Class", "#foo a:not(.blog)", ["yahoo", "anchor2"] );
	t( ":not() Multiple Class", "#foo a:not(.link)", ["yahoo", "anchor2"] );
	t( ":not() Multiple Class", "#foo a:not(.blog.link)", ["yahoo", "anchor2"] );

	t( ":not chaining (compound)", "#qunit-fixture div[id]:not(:has(div, span)):not(:has(*))", ["divWithNoTabIndex"] );
	t( ":not chaining (with attribute)", "#qunit-fixture form[id]:not([action='formaction']):not(:button)", ["lengthtest", "name-tests", "testForm"] );
	t( ":not chaining (colon in attribute)", "#qunit-fixture form[id]:not([action='form:action']):not(:button)", ["form", "lengthtest", "name-tests", "testForm"] );
	t( ":not chaining (colon in attribute and nested chaining)", "#qunit-fixture form[id]:not([action='form:action']:button):not(:input)", ["form", "lengthtest", "name-tests", "testForm"] );
	t( ":not chaining", "#form select:not(.select1):contains(Nothing) > option:not(option)", [] );
});

test("pseudo - position", function() {
	expect( 32 );

	t( "First element", "div:first", ["qunit-testrunner-toolbar"] );
	t( "First element(case-insensitive)", "div:fiRst", ["qunit-testrunner-toolbar"] );
	t( "nth Element", "#qunit-fixture p:nth(1)", ["ap"] );
	t( "First Element", "#qunit-fixture p:first", ["firstp"] );
	t( "Last Element", "p:last", ["first"] );
	t( "Even Elements", "#qunit-fixture p:even", ["firstp","sndp","sap"] );
	t( "Odd Elements", "#qunit-fixture p:odd", ["ap","en","first"] );
	t( "Position Equals", "#qunit-fixture p:eq(1)", ["ap"] );
	t( "Position Equals (negative)", "#qunit-fixture p:eq(-1)", ["first"] );
	t( "Position Greater Than", "#qunit-fixture p:gt(0)", ["ap","sndp","en","sap","first"] );
	t( "Position Less Than", "#qunit-fixture p:lt(3)", ["firstp","ap","sndp"] );

	t( "Check position filtering", "div#nothiddendiv:eq(0)", ["nothiddendiv"] );
	t( "Check position filtering", "div#nothiddendiv:last", ["nothiddendiv"] );
	t( "Check position filtering", "div#nothiddendiv:not(:gt(0))", ["nothiddendiv"] );
	t( "Check position filtering", "#foo > :not(:first)", ["en", "sap"] );
	t( "Check position filtering", "#qunit-fixture select > :not(:gt(2))", ["option1a", "option1b", "option1c"] );
	t( "Check position filtering", "#qunit-fixture select:lt(2) :not(:first)", ["option1b", "option1c", "option1d", "option2a", "option2b", "option2c", "option2d"] );
	t( "Check position filtering", "div.nothiddendiv:eq(0)", ["nothiddendiv"] );
	t( "Check position filtering", "div.nothiddendiv:last", ["nothiddendiv"] );
	t( "Check position filtering", "div.nothiddendiv:not(:lt(0))", ["nothiddendiv"] );

	t( "Check element position", "div div:eq(0)", ["nothiddendivchild"] );
	t( "Check element position", "div div:eq(5)", ["t2037"] );
	t( "Check element position", "div div:eq(29)", ["slideup"] );
	t( "Check element position", "div div:first", ["nothiddendivchild"] );
	t( "Check element position", "div > div:first", ["nothiddendivchild"] );
	t( "Check element position", "#dl div:first div:first", ["foo"] );
	t( "Check element position", "#dl div:first > div:first", ["foo"] );
	t( "Check element position", "div#nothiddendiv:first > div:first", ["nothiddendivchild"] );
	t( "Chained pseudo after a pos pseudo", "#listWithTabIndex li:eq(0):contains(Rice)", ["foodWithNegativeTabIndex"] );

	t( "Check sort order with POS and comma", "#qunit-fixture em>em>em>em:first-child,div>em:first", ["siblingfirst", "siblinggreatgrandchild"] );

	t( "Isolated position", ":last", ["fx-tests"] );

	// Sizzle extension
	var oldPOS = Sizzle.selectors.match["POS"];
	Sizzle.selectors.match["POS"] = new RegExp( oldPOS.source.replace("first", "primary"), "gi" );
	Sizzle.selectors.setFilters["primary"] = Sizzle.selectors.setFilters["first"];
	t( "Extend Sizzle's POS selectors to rename first to primary", "div:primary", ["qunit-testrunner-toolbar"] );
	// Reset
	Sizzle.selectors.match["POS"] = oldPOS;
	delete Sizzle.selectors.setFilters["primary"];
});

test("pseudo - form", function() {
	expect( 10 );

	var extraTexts = jQuery("<input id=\"impliedText\"/><input id=\"capitalText\" type=\"TEXT\">").appendTo("#form");

	t( "Form element :input", "#form :input", ["text1", "text2", "radio1", "radio2", "check1", "check2", "hidden1", "hidden2", "name", "search", "button", "area1", "select1", "select2", "select3", "select4", "select5", "impliedText", "capitalText"] );
	t( "Form element :radio", "#form :radio", ["radio1", "radio2"] );
	t( "Form element :checkbox", "#form :checkbox", ["check1", "check2"] );
	t( "Form element :text", "#form :text", ["text1", "text2", "hidden2", "name", "impliedText", "capitalText"] );
	t( "Form element :radio:checked", "#form :radio:checked", ["radio2"] );
	t( "Form element :checkbox:checked", "#form :checkbox:checked", ["check1"] );
	t( "Form element :radio:checked, :checkbox:checked", "#form :radio:checked, #form :checkbox:checked", ["radio2", "check1"] );

	t( "Selected Option Element", "#form option:selected", ["option1a","option2d","option3b","option3c","option4b","option4c","option4d","option5a"] );
	t( "Selected Option Element are also :checked", "#form option:checked", ["option1a","option2d","option3b","option3c","option4b","option4c","option4d","option5a"] );
	t( "Hidden inputs should be treated as enabled. See QSA test.", "#hidden1:enabled", ["hidden1"] );

	extraTexts.remove();
});

test("caching", function() {
	expect( 1 );
	Sizzle( ":not(code)", document.getElementById("ap") );
	deepEqual( Sizzle( ":not(code)", document.getElementById("foo") ), q("sndp", "en", "yahoo", "sap", "anchor2", "simon"), "Reusing selector with new context" );
});
