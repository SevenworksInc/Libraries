/*!
 * jQuery PushState plugin
 * Original author: Antonio Salvati - @salvan13 - salvan13@gmail.com
 * Licensed under the MIT license
 */

;(function ( $, window, document, undefined ) {

    //defaults
    var pluginName = 'pushState';
    var defaults = {
        debug: false,
        load: [],
        onBeforePageLoad: function(plugin, href) {
            var containers = plugin.options.load;
          /*  for (var i = 0; i < containers.length; i++) {
                var container = containers[i];
                $(container).css({opacity: '0.4'});
            }*/
        },
        onAfterPageLoad: function(plugin, href) {
            var containers = plugin.options.load;
            for (var i = 0; i < containers.length; i++) {
                var container = containers[i];
                $(container).css({opacity: '1'});
            }
        },
        onFailPageLoad: function(plugin, href) {
            //alert("error while loading page \"" + href +"\"");
			var errorArr = new Array();
			errorArr[0] = "Error while loading page ";
			errorArr[1] = "\"" + href +"\"";
			CMS.showNotification('error', errorArr);
			$('a#forcedRefresh').attr('href',$('#thisURL').text());
			$('a#forcedRefresh').trigger('click');
			NProgress.done();
        },
        ignore: function(link, elem) {
            return (link && ( link.match("^http")=="http" || link.charAt(0) == "#" ));
        }
    };

    // plugin constructor
    function Plugin( element, options ) {
        this.element = element;
        this.options = $.extend( {}, defaults, options);
        this._defaults = defaults;
        this._name = pluginName;
        this.init();
    }

    Plugin.prototype = {
        
        init: function () {
            var self = this;

            //apply pugin only if browser support history.pushState
            if (!history.pushState) {
                return;
            }

            $(self.element).on('click', 'a', function(e) {
                var a = $(this);
                var href = a.attr('href');
                if(self.options.ignore(href, a)) {
                    return true;
                }
                self._load(href, true);
                return false;
            });

            window.onpopstate = function(event) {

              if(event.state) {
                self._debug(event.state);
                self._load(event.state.href, false);
              }else {
                if(!$.browser.webkit) { //webkit implement onpopstate in different mode: call it on page load :(
                  location.reload();
                }
              }
              
            }; 

            
        },

        _load: function(href, push) {
            var self = this;
            self._debug("loading " + href);
            self.options.onBeforePageLoad(self, href);
            var containers = self.options.load;
            $.ajax({
                type: 'GET',
                url: href
            }).done(function(res) {
            	
            	var title = $(res).filter("title").text();
				if(title == 'Administrator Login'){
					CMS.showNotification('danger','Your session has expired. Redirecting to home page..');
					setTimeout(function(){
						window.location.href=thisURL+'login/1';
					},3000);
					exit(0);
				}
            	else{
					$("title").text(title);
					for (var i = 0; i < containers.length; i++) {
						var container = containers[i];
						var data = $(container, $(res)).contents(); 
						$(container).html(data);
					}

					if(push){
						var state = { href: href, title: title };
						history.pushState(state, title, href);
					}
				}
            }).fail(function() {
                self.options.onFailPageLoad(self, href);
            }).always(function() {
                self.options.onAfterPageLoad(self, href);
            });
        },

        _debug: function(data) {
            if(this.options.debug && window.console) {
                console.log(data);
            }
        }

    };

    $.fn[pluginName] = function ( options ) {
        var args = arguments;
        if (options === undefined || typeof options === 'object') {
            return this.each(function () {
                if (!$.data(this, 'plugin_' + pluginName)) {
                    $.data(this, 'plugin_' + pluginName, new Plugin( this, options ));
                }
            });
        } else if (typeof options === 'string' && options[0] !== '_' && options !== 'init') {
            return this.each(function () {
                var instance = $.data(this, 'plugin_' + pluginName);
                if (instance instanceof Plugin && typeof instance[options] === 'function') {
                    instance[options].apply( instance, Array.prototype.slice.call( args, 1 ) );
                }
            });
        }
    }

})( jQuery, window, document );