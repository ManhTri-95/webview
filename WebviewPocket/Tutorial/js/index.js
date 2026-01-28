(function() {
   /**
   * Creates a DOM element with specified attributes
   * @private
   * @param {string} tag - HTML tag name
   * @param {Object} options - Element attributes and properties
   * @returns {HTMLElement}
   */
  function createElement (tag, { className, textContent, innerHTML, events = {}, ...attributes }) {
    const element = document.createElement(tag);

    if (className) element.className = className;

    if (innerHTML !== undefined) {
      element.innerHTML = innerHTML;
    } else if (textContent !== undefined) {
      element.textContent = textContent;
    }

    Object.entries(attributes).forEach(([key, value]) => {
      if (value !== undefined && value !== null) { 
        element.setAttribute(key, value);
      }
    });

    Object.entries(events).forEach(([event, handler]) => {
      if (typeof handler === 'function') { 
        element.addEventListener(event, handler);
      }
    });
    return element;
  }

  class Tutorial {
    #container = null;
    #course = {};
    #actions = [];
    #steps = [];

    // Footprint direction mappings based on action count
    #footprintDirectionsMap = {
      6: ['right', 'left', 'left', 'right', 'right'],
      5: ['right', 'left', 'right', 'right'],
      4: ['right', 'left', 'right'],
      3: ['right', 'right'],
      2: ['left']
    };

    // Number to word conversion for steps
    #numberWords = ['first', 'second', 'third', 'fourth', 'fifth'];

    /**
     * Initializes the form with provided data
     * @public
     * @param {Object} data - Initial form data
     */

    init(dataInit) {
      try {
        let parsedData = dataInit;
        if (typeof dataInit === 'string') {
          try {
            parsedData = JSON.parse(dataInit);
          } catch (error) {
            throw new Error(`Failed to parse dataInit JSON: ${error.message}`);
          }
        }
        if (typeof parsedData !== 'object' || parsedData === null) {
          throw new Error('dataInit must be a valid object or JSON string representing an object');
        }
       const { data = {} } = parsedData || {};
        this.#validateInitData(data);
        this.#course = this.#extractCourseData(data);
        this.#actions = this.#cloneActions(data.actions);
        this.#updateSteps();
        this.#render(); 
  
      } catch (error) {
        this.#sendError('Initialization failed', { error: error.message });
        throw error;
      }
    }

    /**
     * Updates action status
     * @public
     * @param {number} actionId - Action ID
     * @param {Array} taskUpdates - Task updates
     */
    updateActionStatus({ actionId, finished }) { 
      console.log('updateActionStatus', actionId, finished);
      if(!this.#validateUpdateInputs(actionId, finished)) return;
      const actionIndex = this.#actions.findIndex(a => a.id === actionId);
     
      if (actionIndex === -1 || !this.#isPreviousComplete(actionIndex)) return;
      
      if (this.#updateTasks(actionId, actionIndex, finished)) {
        this.#updateSteps();
        this.#refreshUI();
      }
    }

    /**
     * Validates initialization data
     * @private
     * @throws {Error} If validations fails
     */
    #validateInitData(data) {
      if (!data?.actions?.length) {
        throw new Error('Invalid or missing actions data');
      }
    }

     /**
     * Validates update inputs
     * @private
     */
    #validateUpdateInputs(actionId, finished) { 
      if (!actionId) {
        this.#sendError(`Invalid action ID: ${actionId}`, { actionId });
        return false;
      }

      if (typeof finished !== 'boolean') {
        this.#sendError('Finished must be a boolean value', { finished });
        return false;
      }
      return true;
     }

    /**
     * Extracts course data from input
     * @private
     * @returns {Object} Course data
     */
    #extractCourseData({ id, bg_color, illustration, illus_assets }) {
      return { 
        id, 
        bg_color,
        illus_assets,
        illustration: illustration || 'dog'
       }
    }


    /**
     * Creates a deep clone of actions
     * @private
     */
    #cloneActions(actions) {
      const newActions = structuredClone(actions).sort((a, b) => a.order - b.order);
      return newActions
    }
    /**
     * Creates a deep clone of actions
     * @private
     * @returns {Array} Cloned actions
     */
    // #deepCloneActions (actions) {
    //   return actions.map(action => ({
    //     ...action,
    //     tasks: [...action.tasks]
    //   }));
    // }

    /**
     * Gets footprint directions for steps
     * @private
     */
    #getFootprintDirections() {
      return this.#footprintDirectionsMap[this.#actions.length] || [];
    }

    /**
     * Finds index of first incomplete action
     * @private
     * @returns {number} Index or length of actions
     */
    #findFirstIncompleteActionIndex () {
      return this.#actions.findIndex(
        action => action.tasks.some(task => !task.finished)
      ) ?? this.#actions.length;
    }

    /**
     * Generates step class name
     * @private
     * @returns {string} Class name
     */
    #getStepClassName (isFirst, isLast, isCompleted) {
      return [
        'tutorial-action',
        isFirst && 'tutorial-action--first',
        isLast && 'tutorial-action--end',
         isCompleted && 'tutorial-action--done'
      ].filter(Boolean).join(' ');
    }

    /**
     * Creates a single step object
     * @private
     * @returns {Object} Step configuration
     */
    #createStep(action, index, footprintDirections, firstIncompleteIndex) {
      const isFirst = index === 0;
      const isLast = index === this.#actions.length - 1;
      const isCompleted = action.tasks.every(task  => task.finished);
     
      return {
        className: this.#getStepClassName(isFirst, isLast, isCompleted),
        task: {
          icon: action.icon,
          content: action.title,
          animal: index === firstIncompleteIndex 
            ? `${this.#course.illus_assets}${this.#course.illustration}/icon-${this.#course.illustration}.png`
            : undefined,
          actionId: action.id
        },
        footer: this.#createFooter(isLast, isCompleted, index, footprintDirections),
        text: isFirst ? 'Start' : undefined,
        title: action.title,
        bg_color: action.bg_color,
        completed: isCompleted,
        isFirst
      }
    }

    /**
     * Maps actions to steps for rendering
     * @private
     */
     #updateSteps() {
      const footprintDirections = this.#getFootprintDirections();
      const firstIncompleteIndex = this.#findFirstIncompleteActionIndex();
      this.#steps = this.#actions.map((action, index) => {
        return this.#createStep(action, index, footprintDirections, firstIncompleteIndex)
      });
    }

    /**
     * Converts number to word
     * @private
     * @returns {string} Word representation
     */
    #numberToWord (num) {
      return this.#numberWords[num - 1] || `step${num}`;
    }

    /**
     * Renders the tutorial structure
     * @private
     */
    #render() {
      if(!this.#container) this.#createContainer();
      this.#refreshUI();
    }

    /**
     * Refreshes the UI with updated steps
     * @private
     */
    #refreshUI() { 
      this.#container.innerHTML = '';
      const wrapperInner = createElement('div', { className : 'tutorial-wrapper-inner'});
      const wrapper =  createElement('div', { className: 'tutorial-wrapper' });
      this.#steps.forEach(step => {
        const action = this.#createActionElement(step);
        wrapper.appendChild(action);
      });

      wrapperInner.append(
        wrapper,
        this.#createDecorativeImage('first', `${this.#course.illus_assets}${this.#course.illustration}/decor_left.png`),
        this.#createDecorativeImage('second', `${this.#course.illus_assets}${this.#course.illustration}/decor_right.png`),
      );

      this.#container.appendChild(wrapperInner);
    }

    /**
     * Creates action element
     * @private
     * @param {HTMLElement} Action element 
     */
    #createActionElement (step) {
      console.log(step)
      const action = createElement('div', { className: step.className });
      const actionWrapper = createElement('div', { className: 'tutorial-action-wrapper'});

      actionWrapper.appendChild(this.#createActionLabel(step.task, step.isFirst));
      if (step.task) {
        actionWrapper.appendChild(createElement('div', {
          className: 'tutorial-text',
          textContent: step.text 
        }));
      }

      action.append(actionWrapper, this.#createFootPrint(step))
      //action.append(actionWrapper)
      return action;
    }
    
    /**
     * Creates decorative image element
     * @private
     * @returns {HTMLElement} Image container
     */
    #createDecorativeImage(position, src) {
      const container = createElement('div', {
        className: `decorative-image decorative-image--${position}`,
        'data-total-action': this.#actions.length
      });
      container.appendChild(this.#createImage(src));
      return container;
    }


    /**
     * Creates footprint element
     * @private
     * @returns {HTMLElement} Footer element
     */
    #createFootPrint ({ footer, completed }) {
      return footer.type === 'footprint'
        ? this.#createFootprintElement(footer, completed)
        : this.#createFlagElement(footer);
    }

    /**
     * Creates footprint element
     * @private
     * @returns {HTMLElement} Footprint element
     */
    #createFootprintElement (footer, completed) {
      const { className, foot } = footer;
      const footprint = createElement('div', {
        className: `tutorial-action-footprint ${className}`,
        'data-total-action': this.#actions.length 
      })

      const inner = createElement('div', {
        className: `tutorial-action-footprint-inner${completed ? ' finished' : ' unfinished'} direction-${foot.direction}`
      });

      for (let i = 0; i < foot.count; i++) {
        inner.appendChild(this.#createImage(foot.src));
      }
      footprint.appendChild(inner);
      return footprint;
    }

    
    /**
     * Creates flag element
     * @private
     * @returns {HTMLElement} Flag element
     */
    #createFlagElement({ src, text }) {
      const flag = createElement('div', { className: 'tutorial-flag-end' });
      const imgFlag = createElement('div', { className: 'img-flag' });
      imgFlag.appendChild(this.#createImage(src));
      flag.append(
        imgFlag,
        createElement('div', { className: 'tutorial-text', textContent: text })
      );

      return flag;
    }

    /**
     * Checks if previous actions are complete
     * @private
     * @returns {boolean} Completion status
     */
    #isPreviousComplete(actionIndex) { 
      const isPreviousComplete = this.#actions
        .slice(0, actionIndex)
        .every(action => action.tasks.every(task => task.finished));
      if (!isPreviousComplete) {
        this.#sendError(`Cannot update action because previous actions are incomplete`, { actionIndex });
        return false;
      }
      return true;
    }

    #updateTasks (actionId, actionIndex, finished) {
      const action = this.#actions[actionIndex];
      let updated = false;

      action.tasks.forEach(task => {
        if (task.finished !== finished) {
          task.finished = finished;
          updated = true;
        }
      });

      return updated;
    }

    /**
     * Creates the main container structure
     * @private
     */
    #createContainer () {
      document.body.style.setProperty('--bg-body', this.#course.bg_color);
      this.#container = createElement('div', 
        { 
          className: 'tutorial', 
          style: `background: url("${this.#course.illus_assets}icon-default/line.svg") no-repeat center center` 
        });
      document.body.prepend(this.#container);
    }

    /**
     * Creates action label element
     * @private
     * @returns {HTMLElement} Task element
     */
    #createActionLabel (task, isFirst) { 
      const actionItem = createElement('div', {
        className: 'tutorial-task',
        events:  { click: () => this.#evtHandleAction(task.actionId) }
      });

      if (task.animal) {
        actionItem.appendChild(this.#createAnimalElement(task.animal))
      }

      actionItem.append(
        this.#createCheckmarkElement(isFirst),
        this.#createTaskInnerElement(task.icon, task.content)
      );
      return actionItem
    }

    /**
     * Creates animal element
     * @private
     * @returns {HTMLElement} Animal element
     */
    #createAnimalElement (animalSrc) {
      const animalDiv = createElement('div', { 
        className: 'tutorial-animal', 
        'data-total-action': this.#actions.length 
      });
      animalDiv.appendChild(this.#createImage(animalSrc));
      return animalDiv
    }

    /**
     *  Creates action label inner element
     * @private
     * @returns {HTMLElement} Action label inner element
     */
    #createTaskInnerElement(icon, content) { 
      const inner = createElement('div', { className: 'tutorial-task-inner' });
      const iconDiv = createElement('div', { className: 'task-icon' });
      iconDiv.appendChild(this.#createImage(icon));

      inner.append(
        iconDiv,
        createElement('div', { className: 'task-content', innerHTML: content})
      )
      return inner
    }

    /**
     * Creates checkmark element
     * @private
     * @param {Boolean} isFirst 
     * @returns {HTMLElement} Checkmark element
     */
    #createCheckmarkElement(isFirst) { 
      const checkmark = createElement('div', { className: 'checkmark-finished' });
      const checkmarkInner = createElement('div', { className: 'checkmark-inner' });
      const txtCheckMark = createElement('span', { textContent: 'Complete!' });

      checkmarkInner.append(
        this.#createImage(`${this.#course.illus_assets}icon-default/checkmark-finished.png`),
        !isFirst ? txtCheckMark : ''
      );
      checkmark.appendChild(checkmarkInner);
      return checkmark;
    }

    /**
     * Creates image element
     * @private
     * @returns {HTMLElement} Image element
     */
    #createImage(src) {
      return createElement('img', { src, alt: ''});
    }

    /**
     * Creates footer configuration
     * @private
     * @returns {Object} Footer configuration
     */
    #createFooter(isLast, isCompleted, index, footprintDirections) {
      if (isLast) {
        return {
          type: 'flag',
          src: isCompleted ? `${this.#course.illus_assets}/icon-default/icon-flag-finished.png` : `${this.#course.illus_assets}/icon-default/icon-flag.png`,
          text: 'GOAL'
        }
      }
    
      return {
        type: 'footprint',
        className: `tutorial-action-footprint--${this.#numberToWord(index + 1)}`,
        foot: {
          count: index === 0 ? 3 : 2,
          src:  `${this.#course.illus_assets}${this.#course.illustration}/footprint${isCompleted ? '-finished' : ''}.png`,
          direction: `${footprintDirections[index]}`
        }
      }
    }


    #sendError (message, details = {}) {
      this.postMessage('handleError', {
        type: 'error',
        message,
        details
      })
    }

    #evtHandleAction (actionId) {
      const actionIndex = this.#actions.findIndex(a => a.id === actionId);
      if (actionIndex === -1) return;
     
      this.postMessage('openTask', {
        actionId,
        isValid: this.#isPreviousComplete(actionIndex)
      });
    }

    postMessage (type, data) {
      if (typeof type !== 'string' || !type.trim()) {
        console.error('Message type must be a non-empty string');
        return;
      }

      try {
        const message = JSON.stringify(data);
        
        if ('webkit' in window && window.webkit.messageHandlers[type]) {
          window.webkit.messageHandlers[type].postMessage(message);
        } else if ('android' in window && (window.android || window.Android)[type]) {
          (window.android || window.Android)[type](message);
        } else {
          console.warn(`No valid message handler found for type: ${type}`);
        }
      } catch (error) {
        console.error(`Failed to send message of type "${type}":`, error);
      }
    }
  }

  const tutorial = new Tutorial();

  window.initTutorialApp = function (data) { 
    let e = null; 
    let isSuccess = false;
    try {
      tutorial.init(data);
      isSuccess = true;
    } catch (error) {
      e = error.message;
    }
    tutorial.postMessage('loadFinished', {error: e, "success": isSuccess});
    return isSuccess; 
  }
  tutorial.postMessage('javascriptLoaded', {"success": true});
  window.initTutorialApp({
    "device": "ios",
    "data":{
      "id": "1",
      "title": "JavaSharp",
      "date": "1970/01/01",
      "bg_color": "#efefef",
      "title_color": "#4473c5",
      "survey": "I hate Java",
      "icon": "https://www.test.learningpocket.com/uploads/course/19x5h8skE5AkL1kZ.jpg",
      "illustration": "dog",
      "count_action": 2,
      "total_action": 2,
      "type": "FLOW_CHART",
      "progress_notify": "Java good job!!",
      "progress_msg": "コンプリートまであと__percent__%！",
      "llus_assets": "https://test.learningpocket.com/assets/images/tutorials/",
      "illus_assets": "./images/tutorials/",
      "last_updated": 0,
      "actions": [
        {
          "id": "2",
          "icon": "https://www.test.learningpocket.com/uploads/course/8b7of8qkF5ZkN1nS.jpg",
          "title": "JavaSharp step 1",
          "sub_title": null,
          "thumb": "https://www.test.learningpocket.com/uploads/course/fbksR8hka5qkz1u4.jpg",
          "bg_color": "#f6fcf2",
          "bd_color": "#cfe6c0",
          "order": 0,
          "total_task": 2,
          "count_task": 0,
          "finished": false,
          "tasks": [
              {
                  "id": "1",
                  "title": "Java# task 1",
                  "thumb": "https://www.test.learningpocket.com/uploads/course/image_2024_11_15T04_29_28_850Z.png",
                  "order": 0,
                  "finished": false
              },
              {
                  "id": "2",
                  "title": "Java# task 2",
                  "thumb": "https://www.test.learningpocket.com/uploads/course/image_2025_02_21T03_29_08_924Z.png",
                  "order": 1,
                  "finished": false
              },
              {
                  "id": "3",
                  "title": "Java# task 3",
                  "thumb": "https://www.test.learningpocket.com/uploads/course/image22safa2.png",
                  "order": 2,
                  "finished": false
              }
          ]
        },
        {
          "id": "2",
          "icon": "https://www.test.learningpocket.com/uploads/course/fbksR8hka5qkz1u4.jpg",
          "title": "JavaSharp step 2",
          "sub_title": null,
          "thumb": "https://www.test.learningpocket.com/uploads/course/8b7of8qkF5ZkN1nS.jpg",
          "bg_color": "#f2f8fc",
          "bd_color": "#c0d6e6",
          "order": 1,
          "total_task": 1,
          "count_task": 0,
          "finished": true,
          "tasks": [
            {
              "id": "8",
              "title": "Java# task 3",
              "thumb": "https://www.test.learningpocket.com/uploads/course/Yk91k87kj5wkQ101.png",
              "order": 0,
              "finished": false
            },
            {
              "id": "10",
              "title": "Java# task 4",
              "thumb": "https://www.test.learningpocket.com/uploads/course/image_2024_11_15T04_29_28_850Z.png",
              "order": 1,
              "finished": false
            }
          ]
        },   
      ]
  }});

  // window.initTutorialApp("{\
  //   \"device\": \"ios\",\
  //   \"data\": {\
  //       \"id\": \"1\",\
  //       \"title\": \"JavaSharp\",\
  //       \"date\": \"1970/01/01\",\
  //       \"bg_color\": \"#efefef\",\
  //       \"title_color\": \"#4473c5\",\
  //       \"survey\": \"I hate Java\",\
  //       \"icon\": \"https://www.test.learningpocket.com/uploads/course/19x5h8skE5AkL1kZ.jpg\",\
  //       \"illustration\": \"dog\",\
  //       \"count_action\": 2,\
  //       \"total_action\": 2,\
  //       \"type\": \"FLOW_CHART\",\
  //       \"progress_notify\": \"Java good job!!\",\
  //       \"progress_msg\": \"コンプリートまであと__percent__%！\",\
  //       \"illus_assets\": \"./images/tutorials/\",\
  //       \"last_updated\": 0,\
  //       \"actions\": [\
  //           {\
  //               \"id\": \"1\",\
  //               \"icon\": \"https://www.test.learningpocket.com/uploads/course/8b7of8qkF5ZkN1nS.jpg\",\
  //               \"title\": \"JavaSharp step 1\",\
  //               \"sub_title\": null,\
  //               \"thumb\": \"https://www.test.learningpocket.com/uploads/course/fbksR8hka5qkz1u4.jpg\",\
  //               \"bg_color\": \"#f6fcf2\",\
  //               \"bd_color\": \"#cfe6c0\",\
  //               \"order\": 0,\
  //               \"total_task\": 2,\
  //               \"count_task\": 0,\
  //               \"finished\": false,\
  //               \"tasks\": [\
  //                   {\
  //                       \"id\": \"1\",\
  //                       \"title\": \"Java# task 1\",\
  //                       \"thumb\": \"https://www.test.learningpocket.com/uploads/course/image_2024_11_15T04_29_28_850Z.png\",\
  //                       \"order\": 0,\
  //                       \"finished\": false\
  //                   },\
  //                   {\
  //                       \"id\": \"2\",\
  //                       \"title\": \"Java# task 2\",\
  //                       \"thumb\": \"https://www.test.learningpocket.com/uploads/course/image_2025_02_21T03_29_08_924Z.png\",\
  //                       \"order\": 1,\
  //                       \"finished\": false\
  //                   },\
  //                   {\
  //                       \"id\": \"3\",\
  //                       \"title\": \"Java# task 3\",\
  //                       \"thumb\": \"https://www.test.learningpocket.com/uploads/course/image22safa2.png\",\
  //                       \"order\": 2,\
  //                       \"finished\": false\
  //                   }\
  //               ]\
  //           },\
  //           {\
  //               \"id\": \"2\",\
  //               \"icon\": \"https://www.test.learningpocket.com/uploads/course/fbksR8hka5qkz1u4.jpg\",\
  //               \"title\": \"JavaSharp step 2\",\
  //               \"sub_title\": null,\
  //               \"thumb\": \"https://www.test.learningpocket.com/uploads/course/8b7of8qkF5ZkN1nS.jpg\",\
  //               \"bg_color\": \"#f2f8fc\",\
  //               \"bd_color\": \"#c0d6e6\",\
  //               \"order\": 1,\
  //               \"total_task\": 1,\
  //               \"count_task\": 0,\
  //               \"finished\": false,\
  //               \"tasks\": [\
  //                   {\
  //                       \"id\": \"8\",\
  //                       \"title\": \"Java# task 3\",\
  //                       \"thumb\": \"https://www.test.learningpocket.com/uploads/course/Yk91k87kj5wkQ101.png\",\
  //                       \"order\": 0,\
  //                       \"finished\": false\
  //                   },\
  //                   {\
  //                       \"id\": \"10\",\
  //                       \"title\": \"Java# task 4\",\
  //                       \"thumb\": \"https://www.test.learningpocket.com/uploads/course/image_2024_11_15T04_29_28_850Z.png\",\
  //                       \"order\": 1,\
  //                       \"finished\": false\
  //                   }\
  //               ]\
  //           }\
  //       ]\
  //   }\
  // }");

  window.updateActionStatus = function (params) {
    tutorial.updateActionStatus(params)
  }
  //updateActionStatus(3, [
  //   { taskId: 6, status: 1 },
  // ])
  // updateActionStatus({
  //   actionId: "3",
  //   tasks: [
  //     { id: "11", finished: 1 },
  //     { id: "12", finished: 1 }
  //   ]
  // })
})();