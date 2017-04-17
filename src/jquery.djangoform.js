/**
 * jquery.djangoform.js
 * @version: v1.0
 * @author: Aron de Castro
 *
 * Created by Aron de Castro on 2016-07-07. Please report any bug at T.T
 * Copyright (c) 2016 Aron de Castro
 *
 * The MIT License (http://www.opensource.org/licenses/mit-license.php)
 *
 * Permission is hereby granted, free of charge, to any person
 * obtaining a copy of this software and associated documentation
 * files (the "Software"), to deal in the Software without
 * restriction, including without limitation the rights to use,
 * copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the
 * Software is furnished to do so, subject to the following
 * conditions:
 *
 * The above copyright notice and this permission notice shall be
 * included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
 * EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
 * OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
 * NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
 * HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
 * WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
 * OTHER DEALINGS IN THE SOFTWARE.
 */

/* global jQuery */

(function($){
    var DjangoForm = function(form, obj){
      var that = this;

      this.opt = obj;
      this.form = form;
      this.method = obj.method || "post";
      this.url = obj.url || undefined;
      this.inlines = obj.inlines || [];
      this.inlines_required = obj.inlines_required || {};
      this.eventStatusCode = obj.status_code;
      this.ignoreStatusCode = false;
      this.form.on("submit", function(e){that.submit(e);});

      this.setFieldValidate(obj.validators || {});
      this._fieldsRequired = obj.required || [];
      this._setMask(this.form, obj.ignore_masks || []);
      this._onvalidate = obj.onValidate || function(){};
      this._blur_invalid_class = obj.blur_invalid_class || "form-control-danger";
      this._blur_validate = obj.blurValidate || true;

      this.setBlurFieldsValidate();
    };

    var Validation = function(){
        this.message = "Este campo é obrigatório";
        
        this.clean = function(value){
            return (value.length ? true:false);
        };
    };

    var CNPJValidation = function(){
        this.message = "CNPJ Inválido";

        this.clean = function(value){
            return /[0-9]{2}\.?[0-9]{3}\.?[0-9]{3}\/?[0-9]{4}\-?[0-9]{2}/.test(value);
        };
    };

    var CPFValidation = function(){
        this.message = "CPF inválido";

        this.clean = function(value){
            return /[0-9]{2}\.?[0-9]{3}\.?[0-9]{3}\-?[0-9]{2}/.test(value);
        };
    };

    var EmailValidation = function(){
        this.message = "E-mail inválido";

        this.clean = function(value){
            return /^[-a-z0-9~!$%^&*_=+}{\'?]+(\.[-a-z0-9~!$%^&*_=+}{\'?]+)*@([a-z0-9_][-a-z0-9_]*(\.[-a-z0-9_]+)*\.(aero|arpa|biz|com|coop|edu|gov|info|int|mil|museum|name|net|org|pro|travel|mobi|[a-z][a-z])|([0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}))(:[0-9]{1,5})?$/i.test(value);
        };
    };

    var DateValidation = function(){
        this.message = "Data deve ser maior que 1900."

        this.clean = function(value){
            var v = value.split("/")
            if(v.length == 3){
                if (parseInt(v[2]) > 1899){
                    return true;
                }
            }

            return false;
        };
    }

    DjangoForm.prototype.setRequired = function(value){
        this._fieldsRequired = value;
    };

    var PhoneValidation = function(){
        this.message = "Telefone inválido";

        this.clean = function(value){
            return /\([0-9]{2}\) [0-9]{4}-[0-9]{4,5}/.test(value);
        }
    };

    DjangoForm.prototype.setFieldValidate = function(obj){
        for (var key in obj){
            if (this.fieldValidate[key] !== undefined){
                this.fieldValidate[key].push(new obj[key]());
            }else{
                this.fieldValidate[key] = [new obj[key](), ];
            }
        }
    };

    DjangoForm.prototype.fieldValidate = {
        "default": [new Validation(), ],
        "email": [new Validation(), new EmailValidation(), ],
        "cnpj": [new Validation(), new CNPJValidation(), ],
        "cpf": [new Validation(), new CPFValidation(), ],
        "phone": [new Validation(), new PhoneValidation(), ],
        "date": [new DateValidation(), ]
    };

    DjangoForm.prototype.mask = {
        "cnpj": "00.000.000/0000-00",
        "cpf": "000.000.000-00",
        "phone": "(00) 0000-00009",
        "date": "00/00/0000",
        "date_birth": "00/00/0000",
        "zipcode": "00000-000",
    };

    DjangoForm.prototype.isFieldValid = function(input){
        var validators = this.getValidate(input.attr("name"));
        var value = input.val(), valid = true;

        for (var i = 0, len = validators.length; i < len; i++){
            if (!value || !validators[i].clean(value)){
                this.setMessage(input, validators[i].message);
                return false;
            }
        }
        return true;
    };

    DjangoForm.prototype.getQueryRequired = function(){
        if (this._fieldsRequired.length && this._queryRequiredFields == undefined){
            this._queryRequiredFields = "[name~=" + this._fieldsRequired[0] + "]";

            for (var i=1, len=this._fieldsRequired.length; i < len; i++){
                this._queryRequiredFields += ",[name~=" + this._fieldsRequired[i] + "]";
            }
        }

        return this._queryRequiredFields;
    };

    DjangoForm.prototype.validate = function(){
        var that = this, erro = true;
        if (this._fieldsRequired.length){
            $(this.getQueryRequired()).each(function(){
                var $this = $(this);

                if (!that.isFieldValid($this)){
                    erro = false; 
                }
            });
        }
        this._onvalidate();
        return erro;
    };

    DjangoForm.prototype.openModal = function(message, func){
        (function(target, message, func){
            var modalForm = $("<div class='modal-form' />")
            var modal = $("<div class='fade in modal' role='dialog' tabindex='-1' style='display:block' />")
            .append($("<div class='modal-dialog' />")
            .append($("<div class='modal-content' role='document' />")
            .append($("<div class='modal-body' />")
            .append($("<span class='modal-text'/>").html(message)
            .append($("<button type='button' class='btn btn-primary'>FECHAR</button>").on("click", function(){
                modalForm.remove();
                if(func!=undefined)
                    func();
            }))))));
            modalForm.append($("<div class='modal-backdrop fade in' />"));
            modalForm.append(modal);
            $(target).append(modalForm);
        })("body", message, func);     
    };

    DjangoForm.prototype.setMessage = function(input, message){
        if (!input.hasClass(this._blur_invalid_class)){
            input.addClass(this._blur_invalid_class);
        }

        if (!input.parent().find("span.err-msg").length){
            input.after($("<span class='err-msg' />").html(message));
        }else{
            input.parent().find(".err-msg").html(message);
        }
    };

    DjangoForm.prototype.setNameMessage = function(name, message){
        var input = $("[name="+name+"]");

        if (!input.hasClass(this._blur_invalid_class)){
            input.addClass(this._blur_invalid_class);
        }

        if (!input.parent().find("span.err-msg").length){
            input.after($("<span class='err-msg' />").html(message));
        }else{
            input.parent().find(".err-msg").html(message);
        }
    };

    DjangoForm.prototype.setDataError = function(){
        for(var key in this.data){
            if (typeof(this.data[key][0]) == "string"){
                this.setNameMessage(key, this.data[key]);
            }else{
                this.setDataErrorInline(key, this.data[key]);
            }
        }
    }

    DjangoForm.prototype.setDataErrorInline = function(key, inline){
        for (var i =0, len=inline.length; i < len; i++){
            for (var field in inline[i]){
                this.setNameMessage(key + "-" + i + "-" + field, inline[i][field]);
            }
        }
    }

    DjangoForm.prototype._setMask = function(fields, ignore){
        var that = this;
        for (var key in this.mask){
            $("[name$=" + key + "]").each(function(){
                var $this = $(this);
                if(ignore.indexOf($this.attr("name")) == -1){
                    $this.mask(that.mask[key]);
                }
            });
        }
    };

    DjangoForm.prototype.getValidate = function(name){
        for (var key in this.fieldValidate){
            if (name.indexOf(key) != -1){
                return this.fieldValidate[key];
            }
        }
        return this.fieldValidate['default'];
    }

    DjangoForm.prototype.setBlurFieldsValidate = function(){
        if ( this._blur_validate ){
            var that = this;
            $(this.getQueryRequired()).each(function(){
                var $this = $(this);

                $this.on("blur", function(){
                    if (!that.isFieldValid($this)){
                        that.isFieldValid(field)
                    }
                });
            });
        }
    }

    DjangoForm.prototype.removeErrorField = function(fields){
        $(".err-msg", fields).remove();
        $("." + this._blur_invalid_class).removeClass(this._blur_invalid_class);
    }

    DjangoForm.prototype.setUrl = function(url){
        this.url = url;
    };

    DjangoForm.prototype.submit = function(e){
        e.preventDefault();
        this.removeErrorField(this.form);

        var that = this;
        var is_valid = that.validate();

        if (that.url != undefined && is_valid){
            $("[type=submit]", this.form).attr("disabled", "true");
            var method = that.method.toLowerCase();
            var data = that.getData();
            that.request(that.url, method, data);
        }
    };

    DjangoForm.prototype.callEventStatusCode = function(code, data){
        this.data = data;
        $("[type=submit]", this.form).removeAttr("disabled");
        if(!this.ignoreStatusCode && this.eventStatusCode[code] != undefined){
            return this.eventStatusCode[code].call(this, data);
        }
    };

    DjangoForm.prototype.changeEventStatusCode = function(data){
        this.eventStatusCode = data;
    };

    DjangoForm.prototype.request = function(url, method, data){
        var that = this;
        $.ajax({
            url: url,
            data: data,
            method: method,
            success: function(_data, textStatus, jqXHR){that.callEventStatusCode(jqXHR.status, _data);},
            error: function(jqXHR){
                that.callEventStatusCode(jqXHR.status, JSON.parse(jqXHR.responseText));
            },
            contentType: "application/json",
            headers: {"X-CSRFToken": that.getCsrfToken(),}
        }).done(function(){
            if(that.ondone != undefined){
                that.ondone.call(that, that.data);
            }
        });
    };
  
    DjangoForm.prototype.getCsrfToken = function(){
        return $("[name=csrfmiddlewaretoken]", this.form).val();
    };

    DjangoForm.prototype.serializeInline = function(){
        var name_inline = new RegExp("[A-Za-z_]+-\\d+-([A-Za-z_]+)");
        var names = this.inlines;
        var inlines = [];

        for (var i =0, ilen = names.length; i < ilen; i++){
            var name = names[i], count = $("[name=" + names[i] + "-TOTAL_FORMS]").val();
            var inline = {"name": name, value: []};
            var validate = this.inlines_required[name] || [];

            for (var j = 0, jlen = count; j < jlen; j++){
                var data = {};

                $("[name^=" + name + "-" + j + "]", this.form).each(function(){
                    var $element = $(this);
                    var field = name_inline.exec($element.attr("name"))[1];

                    data[field] = $element.val();
                });

                if(!this.isEmpty(name, data)){
                    inline.value.push(data);
                }
            }
            inlines.push(inline);
        }

        return inlines;
    };

    DjangoForm.prototype.isEmpty = function(name, obj) {
        var req = this.inlines_required[name] || [];
        for (var i =0, len = req.length; i < len; i++){
            if(obj[req[i]] != undefined && !obj[req[i]].length)
                return true;
        }
        return false;
    };


    DjangoForm.prototype.saveLocalStorage = function(){
        if (window.localStorage != undefined){
            var data = this.changeObject(this.form.serializeArray());
            localStorage.setItem("form", JSON.stringify(data));
        }
    };

    DjangoForm.prototype.getLocalStorage = function(){
        if (window.localStorage != undefined){
            var data = JSON.parse(localStorage.getItem("form"));
            if(data && data['csrfmiddlewaretoken'] != undefined){
                delete data['csrfmiddlewaretoken'];
            }
            return data;
        }
    };

    DjangoForm.prototype.updateFormData = function(){
        var data = this.getLocalStorage();
        if (data){
            for (var key in data){
                $("[name="+key+"]").val(data[key]);
            }
        }
    };

    DjangoForm.prototype.clearLocalStore = function(){
        if(window.localStorage != undefined){
            localStorage.clear();
        }
    };

    DjangoForm.prototype.changeObject = function(se){
        var data = {};
        for (var i = 0, len = se.length; i < len; i++){
            if (se[i].value.length > 0){
              data[se[i].name] = se[i].value;
            }
        }
        return data;
    };

    DjangoForm.prototype.clear = function(){
        this.form[0].reset();
        this.clearLocalStore();
    };

    DjangoForm.prototype.serializeForm = function(){
        return this.changeObject(this.form.serializeArray().concat(this.serializeInline()));
    };

    DjangoForm.prototype.getData = function(){
      return JSON.stringify(this.serializeForm());
    };

    $.fn.djForm = function(data){
        this.djform = new DjangoForm(this, data);
        return this;
    };

    $.fn.djRequest = function(obj){
        if (this.djform != undefined){
            this.djform.ignoreStatusCode = false;
            this.djform.changeEventStatusCode(obj.status_code);
            this.djform.request(obj.url, obj.method, JSON.stringify(obj.data));
        }
    };
})($);
