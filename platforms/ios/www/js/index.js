window.URL_TO_SERVER = "URL_TO_SERVER"; //URL of the calling SERVER
window.TOKEN = "-";
window.timeout = 60; //Timeout
var current_tab = 'file'; //Variable that indicates in which tab you are in

//Contents the generic methods of the application
var app = {
    initialize: function() {
        ons.bootstrap(); 
        //Choose what is the initial page
        if(app.firstTime()) myNavigator.replacePage("welcome.html", { animation : 'fadein' });
        else myNavigator.replacePage("home.html", { animation : 'fadein' });
        localStorage.setItem("firstTime", false);
        app.setEvents();
        //Load specific platform styles
        $('head').append($('<link rel="stylesheet" type="text/css"/>').attr('href', "css/"+device.platform.toLowerCase()+".css"));
    },

    //Method that define different events in the app
    setEvents: function() {
        $(window).keydown(function(event) {
            //On Enter key press in the tab URL, submit the form
            if(event.keyCode==13 && current_tab=='url') {
                event.preventDefault();
                $(".text-input:last").blur();
                $(".copypaste:last").blur();
                app.process();
            }
        });
    },

    //Check if it's the first time you open the app
    firstTime: function() { 
        var firstTime = localStorage.getItem("firstTime");
        return firstTime==undefined || firstTime=="true";
    },

    //Method that pick up a file from your local memory
    openChooseFiles: function() {
        var iOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
        if(iOS) window.FilePicker.pickFile(app.successCallback, app.errorCallback);
        else fileChooser.open(app.successCallback, app.errorCallback);
    },

    //Method called on callback success pick up file. We use a differnt plugin depending on iOS or Android
    successCallback: function(url) {
        var iOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
        if(iOS) {
            var extension = url.substr( (url.lastIndexOf('.') +1) );
            file.process(extension, url);
        }
        else {
            window.urlPATH = url;
            window.FilePath.resolveNativePath(url, function(url) {
                var extension = url.substr( (url.lastIndexOf('.') +1) );
                file.process(extension, window.urlPATH);
            }, function(e) {
                app.alert("Error de acceso","No es posible acceder al fichero.","");
            });
        }
    },
    errorCallBack: function(err) {
        //If you want to do something if there is an error
    },

    //Method called if you want to process some text
    process: function() {
        switch(current_tab) {
            case 'file': file.process(); break;
            case 'url': url.process(); break;
            case 'text': text.process(); break;
        }
    },

    //Method that do the analisys of the text
    doMagic: function(text) {
        $("#estado").text("Analizando texto...");
        var data = { 'text': text, 'token': window.TOKEN };
        if(text.trim()!="") {
            window.xhr = $.ajax({
                url: window.URL_TO_SERVER,
                method: "POST",
                data: JSON.stringify(data),
                contentType: 'application/json',
                dataType: 'json',
                success: function(msg) {
                    console.log(msg);
                    $(".loader").hide();
                    $(".result").fadeIn();
                    $("#nivel").text("NIVEL "+ msg.tag);
                    if(msg.tag=="A") {
                        $("#imagen_resultado").attr("src","img/group-a.png");
                        $("#dificultad").text("¡Texto de dificultad fácil!");
                        $("#resumen").text("El texto introducido es correcto y cumple con las características de un texto de dificultad baja.");
                    }
                    else if(msg.tag=="B") {
                        $("#imagen_resultado").attr("src","img/group-b.png");
                        $("#dificultad").text("¡Texto de dificultad media!");
                        $("#resumen").text("El texto introducido es correcto y cumple con las características de un texto de dificultad media.");
                    }
                    else if(msg.tag=="C") {
                        $("#imagen_resultado").attr("src","img/group-c.png");
                        $("#dificultad").text("¡Texto de dificultad complicada!");
                        $("#resumen").text("El texto introducido es correcto y cumple con las características de un texto de dificultad alta.");
                    }
                    else {
                        $("#imagen_resultado").attr("src","img/cancel-music.png");
                        $("#nivel").hide();
                        $("#dificultad").text("¡El texto no se ha podido analizar!");
                        $("#resumen").text("El texto introducido no ha podido ser analizado debido a que no se han reconocido correctamente parte del texto.");
                    }
                },
                timeout: window.timeout*1000,
                error: function(err) {
                    if(err.statusText=="abort") {
                        //If you want to do something if there is an error
                    }
                    else app.alert("Error de procesamiento","El texto no ha podido analizarse correctamente.","");
                }, 
            }); 
        }
        else app.alert("Error de procesamiento","El texto no ha podido analizarse correctamente.","");
    },

    //Overwrite method of an alert
    alert: function(titulo,subtitulo,imagen){
        if(myNavigator.pages.length>1) myNavigator.topPage.remove();
        myNavigator.pushPage("error.html", { 
            animation : 'simpleslide', 
            callback: function(){
                $("#titulo").text(titulo);
                $("#subtitulo").text(subtitulo);
                if(imagen!="") $("#imagen_error").attr("src",imagen);
            } 
        });
    },

    //Method used if you want to cancell the request
    cancel: function() {
        if(window.xhr!=undefined)
            window.xhr.abort();
        if(window.intervalo)
            clearTimeout(window.intervalo);
        myNavigator.replacePage("home.html", { animation : 'simpleslide' });
    },

    //Method to paste the text copied to somewhere
    paste: function(){
        if(current_tab=="url") url.paste();
        else if(current_tab=="text") text.paste();
    }
};

//Contents the specific functions of the URL text type
var url = {
    //Method that process the content of the URL entered
    process: function() {
        window.url_text=$(".text-input:last").val().trim();
        if(!window.url_text.toLowerCase().startsWith("http://") && !window.url_text.toLowerCase().startsWith("https://")) url_text="http://"+url_text;
        if(window.url_text.length>2047){
            ons.notification.alert({
                message: 'La dirección url no está bien formada.',
                modifier: 'material',
                buttonLabel: 'Aceptar',
                title: 'Error'
            }); 
        }
        else if(url.isUrlValid(window.url_text)) {
            myNavigator.pushPage("results.html", { animation : 'simpleslide' , 
                callback: function(){
                    window.url_text = encodeURIComponent(window.url_text);
                    $.when(url.getURLContent(window.url_text))
                    .done(function(theResultSet) {
                        console.log("when loadDoc: "+ theResultSet);
                        var xmlDoc = theResultSet.responseXML;
                        var x = xmlDoc.getElementsByTagName("body");
                        $("#hiddenText").html(x[x.length-1])
                        var inner = $("#hiddenText").html();
                        inner = inner.replace(/<img[^>]*>/g,"");
                        inner = inner.replace(/<iframe[^>]*>/g,"");
                        var x = $($.parseHTML(inner)).text();
                        x=url.removeSpaces(x);
                        $("#hiddenText").html("");
                        app.doMagic(x);
                    })
                    .fail(function(error) { console.log("error loadDoc: "+error); });
                }
            });
        }   
        else {
             ons.notification.alert({
                message: 'La dirección url no está bien formada.',
                modifier: 'material',
                buttonLabel: 'Aceptar',
                title: 'Error'
            }); 
        }
    },
    isUrlValid: function(url_text) {
        return /^(https?|s?ftp):\/\/(((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:)*@)?(((\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5]))|((([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.)+(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.?)(:\d*)?)(\/((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)+(\/(([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)*)*)?)?(\?((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)|[\uE000-\uF8FF]|\/|\?)*)?(#((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)|\/|\?)*)?$/i.test(url_text);
    },
    getURLContent: function(url_text) {
        var deferred = $.Deferred();
        window.xhr = new XMLHttpRequest();
        window.xhr.open("GET", "http://query.yahooapis.com/v1/public/yql?q=select%20*%20from%20html%20where%20url%20%3D%20%22"+url_text+"%2F%3Fnocache%3Dyes%26v%3D3%26int%3D1%22&diagnostics=true", true);
        
        window.xhr.addEventListener('load', function() {
            if(window.xhr.readyState == 4 && window.xhr.status == 200) deferred.resolve(window.xhr);
            else deferred.fail();
        }, function(err) {
            deferred.fail(err);
        });
        
        window.xhr.send();
        return deferred.promise();
    },

    //Method that change de colour of the tabbar
    preparePage: function() {
        $(".paste").fadeIn();
        $(".tabbar_image").each(function() {
            $(this).attr('src', $(this).attr('src').replace("_selected", ""));
        });
        $(".url_image:last").attr('src', 'img/url_selected.png');
        current_tab = 'url';
    },
    removeSpaces: function(x) {
        var spaces = ["  ", "\n ", "\n\n"];
        var replaces = [" ", "\n", "\n"];
        return removeSpacesGeneric(x, spaces, replaces);
    },
    paste: function() {
        cordova.plugins.clipboard.paste(function (text) { 
            if(text.trim()!="")
                $(".text-input:last").val(text);
        });
    }
}

//Contents the specific functions of the File text type
var file = {
    process: function(type, url) {
        switch(type) {
            case 'txt': file.getContentFromTXT(url); break;
            case 'pdf': file.getContentFromPDF(url); break;
            default: app.alert("Error de carga","Lo sentimos, pero el archivo no ha podido ser calificado correctamente. Recuerda que los archivos deben ser pdf o txt.",""); break;
        }
    },
    preparePage: function() {
        $(".paste").hide();
        $(".tabbar_image").each(function() {
            $(this).attr('src', $(this).attr('src').replace("_selected", ""));
        });
        $(".file_image:last").attr('src', 'img/file_selected.png');
        current_tab = 'file';
    },
    removeSpaces: function(x) {
        var spaces = ["  "];
        var replaces = [" "];
        return removeSpacesGeneric(x, spaces, replaces);
    },
    getContentFromPDF: function(url) {
        var str = "";
        var array = [];
        var pdf = PDFJS.getDocument(url);
        pdf.then(function(pdf) {
            myNavigator.pushPage("results.html", { animation : 'simpleslide', 
                callback: function() {

                    /*Timeout*/
                    window.bloqueado=false;
                    window.intervalo = setInterval(function() { temporizador() }, 1000);
                    var momentoInicial = new Date();
                    temporizador(timeout, momentoInicial);

                    var maxPages = pdf.pdfInfo.numPages;
                    for (var j = 1; j <= maxPages; j++) {
                        var page = pdf.getPage(j);

                        // the callback function - we create one per page
                        var processPageText = function processPageText(pageIndex) {
                            return function(pageData, content) {
                                return function(text) {
                                    str ="";
                                    // bidiTexts has a property identifying whether this
                                    // text is left-to-right or right-to-left
                                    for (var i = 0; i < text.items.length; i++) {
                                        if(text.items[i].str!=undefined) {
                                          str += text.items[i].str;
                                        }
                                    }

                                    str = file.removeSpaces(str);
                                    array.push({pageIndex: pageData.pageIndex, text: str });

                                    if (array.length === maxPages) {
                                        array.sort(function(a,b) {
                                            return (a. pageIndex > b. pageIndex) ? 1 : ((b. pageIndex > a. pageIndex) ? -1 : 0);
                                        });
                                        var text ="";
                                        for(var i=0;i<array.length;i++) {
                                            text+=array[i].text;
                                        }
                                         clearTimeout(window.intervalo);
                                         if(!window.bloqueado) {
                                            app.doMagic(text);
                                         }
                                         else {
                                             app.alert("Error al leer","No se ha podido leer el documento.","");
                                         }
                                    }
                                }
                            }
                        }(j);

                        var processPage = function processPage(pageData) {
                            var content = pageData.getTextContent();
                            content.then(processPageText(pageData, content));
                        }
                        if(!window.bloqueado) page.then(processPage);
                        else app.alert("Error de lectura","No es posible leer el texto.","");
                    }


            }});
            

        }).catch(function() {
            app.alert("Error de carga","El texto no se ha cargado correctamente.","");
        });
    },
    getContentFromTXT: function(url) {
        $.ajax({
            url : url,
            dataType: "text",
            success: function (data) {
                myNavigator.pushPage("results.html", { animation : 'simpleslide' });
                app.doMagic(data);
            },
            error: function(err) {
                app.alert("Error de lectura","No es posible leer el texto.","");
            }
        });
    }
}

var text = {
    process: function() {
        var x = $(".copypaste:last").val();
        if(x.trim().length>10){
            myNavigator.pushPage("results.html", { animation : 'simpleslide',callback: function(){
                app.doMagic(x);
            } });
        }
        else {
            //Toast.error('El texto debe contener al menos 10 carácteres.');
            ons.notification.alert({
                message: 'El texto debe contener al menos 10 carácteres.',
                modifier: 'material',
                buttonLabel: 'Aceptar',
                title: 'Error'
            });  
        }
    },
    preparePage: function() {
        $(".paste").fadeIn();
        $(".tabbar_image").each(function() {
            $(this).attr('src', $(this).attr('src').replace("_selected", ""));
        });
        $(".text_image:last").attr('src', 'img/text_selected.png');
        current_tab = 'text';
    },
    paste: function() {
        cordova.plugins.clipboard.paste(function (text) { 
            if(text.trim()!="")
                $("textarea:last").val(text);
        });
    }
}

ons.ready(function() {
    var carousel = document.addEventListener('postchange', function(event) {
        changeCirclesColour(event.activeIndex);
    });
});

function removeSpacesGeneric(x, spaces, replaces) {
    for(var i=0; i<spaces.length; i++) {
        while(x.split(spaces[i]).length>1) {
            x = x.split(spaces[i]).join(replaces[i]);
        }
    }
    return x;
}

function changeCirclesColour(index) {
    console.log(event.activeIndex);
    $(".circle").removeClass("pink").addClass("blue");
    $("#circle-"+index).removeClass("blue").addClass("pink");
}

function temporizador(timeout, momentoInicial) {
    var d = new Date();
    var seconds = (d.getTime() - momentoInicial.getTime())/1000;
    if(seconds>timeout) {
        window.bloqueado=true;
        clearTimeout(window.intervalo);
    }
}