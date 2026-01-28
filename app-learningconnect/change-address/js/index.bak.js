(function() {
  class UserChangeInAddress {
    constructor() {
      this.form = null;
    }

    init(data) {
      this.createForm();
      this.setData(data);
      this.evtScrollFormItem();
    }

    createFormItemDate() {
      /**
      * Create form date
      */
      const formGroupCalendar = document.createElement("div");
      formGroupCalendar.classList.add("form-group", "px-15px");

      const inputGroupCalendar = document.createElement("div");
      inputGroupCalendar.classList.add("input-group");

      const labelCalendar = document.createElement("label");
      labelCalendar.classList.add('form-label');
      labelCalendar.setAttribute("for", "date");
      labelCalendar.innerHTML = `転居日 <span class="required">必須</span>`;

      const formFieldCalendar = document.createElement("input");
      formFieldCalendar.classList.add("form-control");
      formFieldCalendar.setAttribute("type", "text");
      formFieldCalendar.setAttribute("id", "date");
      formFieldCalendar.setAttribute("placeholder", "右のカレンダーから選択");
      formFieldCalendar.setAttribute("required", true);
      formFieldCalendar.setAttribute("disabled", "disabled");

      const btnFormCalendar = document.createElement("button");
      btnFormCalendar.classList.add("btn", "btn--primary", "ml-3");
      btnFormCalendar.setAttribute("type", "button");
      btnFormCalendar.innerHTML = "選択";
      btnFormCalendar.addEventListener("click", this.evtHandleCalendar.bind(this));

      const validationMessage = document.createElement("span");
      validationMessage.classList.add("text-valid");
      validationMessage.innerHTML = "※転居日を入力してください";
    
      formGroupCalendar.appendChild(labelCalendar);
      inputGroupCalendar.appendChild(formFieldCalendar);
      inputGroupCalendar.appendChild(btnFormCalendar);
      formGroupCalendar.appendChild(inputGroupCalendar);
      formGroupCalendar.appendChild(validationMessage); 

      return formGroupCalendar;
    }

    createFormGroupItem (
      labelText, 
      inputType, 
      inputName, 
      inputSize, 
      maxLength, 
      required, 
      customClass, 
      eventHandler
    ) {
      const self = this;
      const formGroup = document.createElement("div");
      formGroup.classList.add('form-group', 'px-15px');
      if (customClass) {
        //formGroup.classList.add(customClass);
        formGroup.className += customClass
      }
     
      const label = document.createElement("label");
      label.classList.add("form-label");
      label.textContent = labelText;

      const spanRequired = document.createElement("span");
      spanRequired.classList.add("required");
      spanRequired.textContent = "必須";

      if(labelText) {
        label.appendChild(spanRequired);
      }

      const input = document.createElement("input");
      input.classList.add("form-control");
      input.setAttribute("type", inputType);
      input.setAttribute("name", inputName);
      input.setAttribute("size", inputSize);
      input.setAttribute("maxlength", maxLength);
      input.addEventListener("blur", function() {
        self.validateInput(input);
      });
      if (eventHandler) {
        input.addEventListener("keyup", eventHandler);
      }

      if (required) {
        input.setAttribute("required", required);
      }

      function validateNumberInput(input) {
        return input.value = input.value.replace(/[^0-9]/g, '');
      }

      if (inputName === 'zip21') {
        input.setAttribute("inputmode", "numeric")
        input.addEventListener('input', function(evt) { 
          const inputValue = validateNumberInput(input); 
          if (inputValue.length > 3) {
            this.value = inputValue.slice(0, 3);
          }
        });
      }

      if (inputName === 'zip22') {
        input.setAttribute("inputmode", "numeric")
        input.addEventListener('input', function(evt) { 
          const inputValue = validateNumberInput(input);
          if (inputValue.length > 4) {
            evt.target.value = inputValue.slice(0, 4);
          }
        });
      }
      
      /**
       * 
       * @param {*} input 
       * @param {*} nextInputName 
       * @description function handle keyup auto focus input when value === maxlength
       */
      function handleInput (input, nextInputName) {
        const value = input.value;
        const maxLength = parseInt(input.getAttribute('maxlength'));
  
        if (value.length === maxLength) {
          const nextInput = document.querySelector(nextInputName);
          nextInput.focus();
        }
      }

      /**
       * 
       * @param {*} event 
       * @param {*} input 
       * @param {*} previousInputName 
       * @description function handle keydown auto focus input when delete value
       */
      function handleKeyDown(event, input, previousInputName) {
        const value = input.value;
        const isDeleting = event.key === 'Backspace' || event.key === 'Delete';
     
        if (value.length === 0 && isDeleting) {
          const previousInput = document.querySelector(previousInputName);
          previousInput.focus();
        }
      }

      if (input.name === 'zip21') {
        input.addEventListener("input", function(){
          handleInput(input, "[name='zip22']");
        });
      }

      if (input.name === 'zip22') {
        input.addEventListener("keydown", function(){
          handleKeyDown(event ,input, "[name='zip21']");
        });
      }

      const validationMessage = document.createElement('span');
      validationMessage.classList.add("text-valid");
      validationMessage.innerHTML = "Please enter required information";

      formGroup.appendChild(label);
      formGroup.appendChild(input);
      formGroup.appendChild(validationMessage)
     
      return formGroup;
    }



    validateForm () {
      const formInputs = this.form.getElementsByTagName("input");
      let isValid = true;
      for (let i = 0; i < formInputs.length; i++) { 
        const input = formInputs[i];
        const formGroup = input.closest(".form-group");
        if (input.hasAttribute("required") && input.value.trim() === "") { 
          formGroup.classList.add("is-invalid");
          //input.parentNode.classList.add("is-invalid");
          isValid = false;
        } else {
          formGroup.classList.remove("is-invalid");
          //input.parentNode.classList.remove('is-valid');
        }

        if (input.name === "zip21") {
          //this.validateZipCode(input);
        }

        if (input.name === "zip22") {
          const zipField1 = this.form.querySelector('input[name="zip21"]');
          const zipField2 = input;
          const zipCode = zipField1.value.trim() + zipField2.value.trim();
    
          if (!/^\d{7}$/.test(zipCode)) {
            formGroup.classList.add("is-invalid");
            isValid = false;
          } else {
            formGroup.classList.remove("is-invalid");
          }
        }
      }

      if (isValid) {
        // Form is valid, perform submission
        console.log("Form submitted successfully");
        this.getData();
      } else {
        // Form is invalid, display error message or take appropriate action
        console.log("Form validation failed");
      }
    }

        // Function to validate an individual input field
    validateInput(input) {
      // Perform validation logic for the input
      const inputValue = input.value;
      const formGroup = input.closest(".form-group");
      if (input.hasAttribute("required") && inputValue.trim() === '') { 
        formGroup.classList.add("is-invalid");
        return false;
      }
      formGroup.classList.remove("is-invalid");
      return true;
    }

    /**
     * Validate zipcode 
     * @param {*} input 
     */
    validateZipCode(input) {
      const formGroup = input.closest(".form-group");
      const zipCode = input.value.trim();
      const isValid = /^\d{3}-?\d{4}$/.test(zipCode);
      if (!isValid) {
        formGroup.classList.add("is-invalid");
      } else {
        formGroup.classList.remove("is-invalid");
      }
    };

    createForm() {
      const body = document.body;

      const container = document.createElement("div");
      container.className = "container";

      const titleWrapper = document.createElement("div");
      titleWrapper.className = "title-wrapper";

      const textTitle = document.createElement("h3");
      textTitle.className = "text-center";
      textTitle.textContent = "住所変更";

      this.form = document.createElement("form");

      const textName = document.createElement("span");
      textName.className = "fs-3 d-inline-block mb-3 px-15px";
      textName.setAttribute("id", "userName");
      textName.textContent = "";

      const formGroupCalendar = this.createFormItemDate();
   
      const spanAddress = document.createElement("span");
      spanAddress.classList.add("d-block", "mt-5", "mb-4", "px-15px");
      spanAddress.textContent = "転居先住所";

      const formGroupZip01 = this.createFormGroupItem(
        "郵便番号", 
        "text", 
        "zip21", 
        "4", 
        "3", 
        true, 
        " d-inline-block w-135px mb-35px", 
        null
      );

      const strikethrough = document.createElement('span');
      strikethrough.classList.add('d-inline-block', 'mx-3');
      strikethrough.textContent = "-";

      const formGroupZip02 = this.createFormGroupItem(
        null, 
        "text", 
        "zip22",
        "5", 
        "4", 
        true, 
        " d-inline-block w-170px mb-35px", 
        function() {
          AjaxZip3.zip2addr("zip21", "zip22", "pref21", "addr21");

          AjaxZip3.onSuccess = function() { 
            const pref = document.querySelector('[name="pref21"]');
            const address = document.querySelector('[name="addr21"]');

            const formGroupPref = pref.closest(".form-group");
            const formGroupAddress = address.closest(".form-group");

            formGroupPref.classList.remove("is-invalid");
            formGroupAddress.classList.remove("is-invalid");
          }

          AjaxZip3.onFailure = function() {
            const zipField1 = document.querySelector('[name="zip21"]');
            const zipField2 = document.querySelector('[name="zip22"]');

            const formGroupZip01 = zipField1.closest(".form-group");
            const formGroupZip02 = zipField2.closest(".form-group");

            const notFoundMsgZip01 = formGroupZip01.querySelector('.text-valid');
            const notFoundMsgZip02 = formGroupZip02.querySelector('.text-valid');

            notFoundMsgZip01.innerText = "郵便番号に該当する住所が見つかりません";
            notFoundMsgZip02.innerText = "郵便番号に該当する住所が見つかりません";

            formGroupZip01.classList.add("is-invalid");
            formGroupZip02.classList.add("is-invalid");
          };

          return false;
        }
      );

      const formGroupPref = this.createFormGroupItem(
        "都道府県", 
        "text", 
        "pref21", 
        "40", 
        null,
        true, 
        null, 
        null
      );

      const formGroupAddress = this.createFormGroupItem(
        "住所", 
        "text", 
        "addr21", 
        "40", 
        null, 
        true, 
        null, 
        null
      );

      const formGroupAddressBuilding = this.createFormGroupItem(
        "建物名 / 号室　（任意）", 
        "text", 
        "building", 
        null, 
        null,
        null, 
        null, 
        null
      );

      const btnSubmit = document.createElement("button");
      btnSubmit.classList.add("btn", "btn--warning", "w-100" ,"mt-5", "d-block", "radius-0");
      btnSubmit.innerHTML= "入力内容を確認する";
      btnSubmit.setAttribute("type", "button");
      btnSubmit.addEventListener("click", this.validateForm.bind(this));

      this.form.appendChild(textName);
      this.form.appendChild(formGroupCalendar);
      this.form.appendChild(spanAddress);
      this.form.appendChild(formGroupZip01);
      this.form.appendChild(strikethrough);
      this.form.appendChild(formGroupZip02);
      this.form.appendChild(formGroupPref);
      this.form.appendChild(formGroupAddress);
      this.form.appendChild(formGroupAddressBuilding);
      this.form.appendChild(btnSubmit);

      titleWrapper.appendChild(textTitle);

      container.appendChild(titleWrapper);
      //container.appendChild(textName);
      container.appendChild(this.form);
      body.prepend(container);
    }

    evtScrollFormItem () {
      const self = this;

      function displayCoordinates(element) {
        const rect = element.getBoundingClientRect();
        return rect.top;
      }

      document.querySelectorAll('input[type="text"], input[type="number"]').forEach(function(input) {
        input.addEventListener('focus', function() {

          switch(input.getAttribute("name")) {
            case 'zip21':
            case 'zip22':
              self.postMessage('focusItem', { value: "zipcode", y: Math.round(displayCoordinates(this)) });
              break;

            case 'pref21':
              self.postMessage('focusItem', { value: "prefecture", y: Math.round(displayCoordinates(this)) });
              break;
            case 'addr21':
              self.postMessage('focusItem', { value: "address", y: Math.round(displayCoordinates(this)) });
              break;
            case 'building':
              self.postMessage('focusItem', { value: "building", y: Math.round(displayCoordinates(this)) });
              break;

            default: 
              break;
          }
        });
      });
    }

    setData(data) {
      const userNameField = this.form.querySelector("#userName");
      const dateField = this.form.querySelector("#date");
      const zipField1 = this.form.querySelector('input[name="zip21"]');
      const zipField2 = this.form.querySelector('input[name="zip22"]');
      const prefField = this.form.querySelector('input[name="pref21"]');
      const addressField = this.form.querySelector('input[name="addr21"]');
      const buildingField = this.form.querySelector('input[name="building"]');

      //const data = JSON.parse(userdata);
      userNameField.innerHTML = 'name' in data ? data.name : '';
      dateField.value = 'date_move' in data ? data.date_move : '';
      zipField1.value = 'zipcode' in data ? data.zipcode.substring(0, 3) : ''; 
      zipField2.value = 'zipcode' in data ? data.zipcode.substring(3) : ''; 
      prefField.value = 'prefectures' in data ? data.prefectures : '';
      addressField.value = 'address' in data ? data.address : '';
      buildingField.value = 'building_room' in data ? data.building_room : '';
    }

    getData () {
      const dateField = this.form.querySelector("#date");
      const zipField1 = this.form.querySelector('input[name="zip21"]');
      const zipField2 = this.form.querySelector('input[name="zip22"]');
      const prefField = this.form.querySelector('input[name="pref21"]');
      const addressField = this.form.querySelector('input[name="addr21"]');
      const buildingField = this.form.querySelector('input[name="building"]');
    
      const userData = {
        date_move: dateField.value,
        zipcode: zipField1.value + zipField2.value,
        prefectures: prefField.value,
        address: addressField.value,
        building_room: buildingField.value,
      };

      this.postMessage('submitData', userData)
    }

    setDataDateField (param) {
      const dateField = this.form.querySelector("#date");
      dateField.value = 'date_move' in param ? param.date_move : '';

      this.validateInput(dateField);
    }

    evtHandleCalendar() {
      this.postMessage('openCalendar', {"value": true});
    }

    postMessage (fncName, msg) {
      try {
        msg = JSON.stringify(msg);
        window[fncName].postMessage(msg);
      } catch (error) {
        console.error('An error occurred while calling the postMessage function:', error);
      }
    }
  }

  // Usage:
  const userChangeInAddress = new UserChangeInAddress();

  window.initCallApp = function (data) {
    let e = null; 
    let isSuccess = false;
    try { 
      userChangeInAddress.init(data)
      isSuccess = true;
    } catch(error) {
      e = error.message;
    }
    userChangeInAddress.postMessage('loadFinished', {error: e, "success": isSuccess})
    return isSuccess; 
  }
  userChangeInAddress.postMessage('javascriptLoaded', {"success": true});
  
  window.selectDate = function(param) {
    userChangeInAddress.setDataDateField(param);
  }
})();