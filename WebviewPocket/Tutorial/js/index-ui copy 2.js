(function() {
 /**
 * Creates a DOM element with specified attributes, styles, and event listeners.
 * @param {string} tag - The HTML tag name.
 * @param {Object} options - Configuration for class, content, events, styles, and attributes.
 * @returns {HTMLElement} The created DOM element.
 */
function createElement(tag, { className, textContent, innerHTML, events = {}, style = {}, ...attributes }) {
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

    Object.entries(style).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
            element.style[key] = value;
        }
    });

    return element;
}

/**
 * Tutorial class for managing an interactive tutorial UI.
 */
class Tutorial {
    #container = null;
    #course = {};
    #actions = [];
    #steps = [];
    #domReferences = {
        wrapper: null,
        wrapperInner: null,
        actionElements: new Map(),
        firstImg: null,
        secondImg: null,
    };
    #resolution = null;
    #heightTopLayout = null;
    #type = null;
    #animal_icons = [];
    #padding_bottom = false;
    #hasValidFirstAction = false;

    #footprintDirectionsMap = {
      7: ['right', 'right', 'left', 'left', 'right', 'right'],
      6: ['right', 'left', 'left', 'right', 'right'],
      5: ['right', 'left', 'right', 'right'],
      4: ['right', 'left', 'right'],
      3: ['right', 'right'],
      2: ['right']
    };

    // Number to word conversion for steps
    #numberWords = ['first', 'second', 'third', 'fourth', 'fifth', 'sixth'];

    /**
     * Initializes the tutorial with provided data.
     * @param {Object|string} dataInit - Initial data or JSON string.
     * @throws {Error} If data is invalid or parsing fails.
     */
    init(dataInit) {
        try {
            const parsedData = typeof dataInit === 'string' ? JSON.parse(dataInit) : dataInit;
            if (!parsedData || typeof parsedData !== 'object') {
                throw new Error('dataInit must be a valid object or JSON string');
            }

            const { data = {}, resolution, height_top_layout, type, padding_bottom } = parsedData;
            this.#resolution = resolution ?? null;
            this.#heightTopLayout = height_top_layout ?? null;
            this.#type = type;
            this.#padding_bottom = padding_bottom ?? false;
            this.#validateInitData(data);
            this.#animal_icons = data?.animal_icons ?? [1, 2]
            const courseChanged = this.#extractCourseData(data);
            const actions = this.#prepareActions(data);
            const actionChanged = this.#cloneActions(actions);
            this.#updateSteps();
            this.#render(courseChanged, actionChanged);

            const setPreviousResult = this.#setPreviousActionsFinished();
            return setPreviousResult;
        } catch (error) {
            throw new Error(`Initialization failed: ${error.message}`);
        }
    }

    /**
     * Prepares actions array, including first action if valid.
     * @private
     * @param {Object} data - Input data containing actions and first_action.
     * @returns {Array} Prepared actions array.
     */
    #prepareActions(data) {
        let actions = data.actions || [];
        this.#hasValidFirstAction = this.#isValidAction(data.first_action);
        if (this.#hasValidFirstAction) {
            const firstAction = {
                ...data.first_action,
                internalId: `${data.first_action.id}_first`,
                order: 0,
                tasks: [],
                icon: data.first_action.icon || null,
                sub_title: data.first_action.sub_title || null,
                bg_color: data.first_action.bg_color || '#ffffff',
                finished: data.first_action.finished ?? false,
                is_first_action: true
            };
            actions = [firstAction, ...actions.map(action => ({
                ...action,
                order: action.order + 1,
                internalId: action.id,
                is_first_action: false
            }))];
        } else {
            actions = [
                {
                    id: 'dummy_start',
                    internalId: 'dummy_start',
                    title: '',
                    order: 0,
                    tasks: [],
                    finished: true,
                    is_first_action: false,
                    bg_color: '#ffffff',
                    is_dummy: true
                },
                ...actions.map(action => ({
                    ...action,
                    order: action.order + 1,
                    internalId: action.id,
                    is_first_action: false
                }))
            ]
            //actions = actions.map(action => ({ ...action, internalId: action.id, is_first_action: false }));
        }
        return actions;
    }

    /**
     * Validates initialization data.
     * @private
     * @param {Object} data - Input data to validate.
     * @throws {Error} If validation fails.
     */
    #validateInitData(data) {
        if (!data?.actions?.length) {
            throw new Error('Invalid or missing actions data');
        }
    }

    /**
     * Extracts and updates course data.
     * @private
     * @param {Object} data - Input course data.
     * @returns {boolean} Whether course data changed.
     */
    #extractCourseData({ id, bg_color, illustration, illus_assets }) {
        const newCourse = { id, bg_color, illustration, illus_assets };
        const changed = JSON.stringify(this.#course) !== JSON.stringify(newCourse);
        this.#course = newCourse;
        return changed;
    }

    /**
     * Clones actions and detects changes.
     * @private
     * @param {Array} actions - List of actions to clone.
     * @returns {Object} Change information.
     */
    #cloneActions(actions) {
        const newActions = structuredClone(actions).sort((a, b) => a.order - b.order);
        const changedActionIds = new Set();
        let changed = false;
        let orderChanged = false;

        if (this.#actions.length !== newActions.length) {
            changed = true;
            orderChanged = true;
            newActions.forEach(a => changedActionIds.add(a.id));
        } else {
            newActions.forEach((newAction, i) => {
                const oldAction = this.#actions[i];
                if (!oldAction || JSON.stringify(oldAction) !== JSON.stringify(newAction)) {
                    changed = true;
                    changedActionIds.add(newAction.id);
                    if (oldAction?.id !== newAction.id) {
                        orderChanged = true;
                    }
                }
            });
        }

        this.#actions = newActions;
        return { changed, changedActionIds, orderChanged };
    }

    /**
     * Updates steps for rendering.
     * @private
     */
    #updateSteps() {
        const footprintDirections = this.#getFootprintDirections();
        const nextActionIndex = this.#findNextActionIndex();
        this.#steps = this.#actions.map((action, index) =>
            this.#createStep(action, index, footprintDirections, nextActionIndex)
        );
    }

    /**
     * Creates a step configuration.
     * @private
     * @param {Object} action - Action data.
     * @param {number} index - Step index.
     * @param {string[]} footprintDirections - Directions for footprints.
     * @param {number} nextActionIndex - Index of next action.
     * @returns {Object} Step configuration.
     */
    #createStep(action, index, footprintDirections, nextActionIndex) {
        const isFirst = index === 0;
        const isLast = index === this.#actions.length - 1;
        const isCompleted = action.finished ?? false;
        const isDummy = action.is_dummy;

        // Define possible animal images for the 7th action
        const randomAnimalImages = ['1.png', '3.png', '5.png'];
        let animalImage;
        if (this.#actions.length === 7 && index === 6 && !action.is_dummy) { 
            const randomIndex = Math.floor(Math.random() * randomAnimalImages.length);
            animalImage = `${this.#course.illus_assets}${this.#course.illustration}/animals/${randomAnimalImages[randomIndex]}`;
        } else {
           animalImage = action.is_dummy ? '' : `${this.#course.illus_assets}${this.#course.illustration}/animals/${index + 1}.png`; 
        }
        return {
            className: this.#getStepClassName(isFirst, isLast, isCompleted, isDummy),
            action: {
                icon: action.icon,
                title: action.title,
                sub_title: action.sub_title,
                bg_color: action.bg_color,
                animal: animalImage,
                animalVisible: index === nextActionIndex && !action.is_dummy,
                actionId: action.internalId,
                is_dummy: action.is_dummy || false
            },
            footer: this.#createFooter(isLast, isCompleted, index, footprintDirections),
            text: isFirst ? 'Start' : undefined,
            title: action.title,
            bg_color: action.bg_color,
            completed: isCompleted,
            isFirst,
            includeTask: !action.is_dummy
        };
    }

    /**
     * Creates footer configuration for a step.
     * @private
     * @param {boolean} isLast - Whether this is the last step.
     * @param {boolean} isCompleted - Whether the step is completed.
     * @param {number} index - Step index.
     * @param {string[]} footprintDirections - Footprint directions.
     * @returns {Object} Footer configuration.
     */
    #createFooter(isLast, isCompleted, index, footprintDirections) {
        if (isLast) {
            return {
                type: 'flag',
                src: isCompleted
                    ? `${this.#course.illus_assets}icon-default/icon-flag-finished.png`
                    : `${this.#course.illus_assets}icon-default/icon-flag.png`,
                text: 'GOAL'
            };
        }

        return {
            type: 'footprint',
            className: `tutorial-action-footprint--${this.#numberToWord(index + 1)}`,
            foot: {
                count: index === 0 ? 3 : 2,
                src: `${this.#course.illus_assets}${this.#course.illustration}/footprints/left_${isCompleted ? 'dark' : 'light'}.png`,
                direction: footprintDirections[index] || 'right'
            }
        };
    }

    /**
     * Converts number to word representation.
     * @private
     * @param {number} num - Number to convert.
     * @returns {string} Word representation.
     */
    #numberToWord(num) {
        return this.#numberWords[num - 1] || `step${num}`;
    }

    /**
     * Gets footprint directions for steps.
     * @private
     * @returns {string[]} Array of directions.
     */
    #getFootprintDirections() {
        return this.#footprintDirectionsMap[this.#actions.length] || [];
    }

    /**
     * Finds the index of the next action to be completed.
     * @private
     * @returns {number} Index of the next action.
     */
    #findNextActionIndex() {
        const finishedActions = this.#actions
            .filter(action => action.finished && !action.is_dummy)
            .sort((a, b) => b.order - a.order);

        if (!finishedActions.length) {
            const minOrderAction = this.#actions
                .filter(action => !action.is_dummy)
                .sort((a, b) => a.order - b.order)[0];
            return this.#actions.findIndex(action => action.order === minOrderAction.order);
        }

        const maxOrder = finishedActions[0].order;
        const nextAction = this.#actions
            .filter(action => !action.finished && !action.is_dummy && action.order > maxOrder)
            .sort((a, b) => a.order - b.order)[0];

        return nextAction
            ? this.#actions.findIndex(action => action.order === nextAction.order)
            : this.#actions.length;
    }

    /**
     * Generates CSS class names for a step.
     * @private
     * @param {boolean} isFirst - Is first step.
     * @param {boolean} isLast - Is last step.
     * @param {boolean} isCompleted - Is step completed.
     * @returns {string} Class names.
     */
    #getStepClassName(isFirst, isLast, isCompleted, isDummy) {
        return [
            'tutorial-action',
            isFirst && 'tutorial-action--first',
            isLast && 'tutorial-action--end',
            isCompleted && 'tutorial-action--done',
            isDummy && 'no-first-action'
        ].filter(Boolean).join(' ');
    }

    /**
     * Sets finished status for previous actions.
     * @private
     * @returns {Object} Result with updated action IDs.
     */
    #setPreviousActionsFinished() {
        const finishedActions = this.#actions
            .filter(action => action.finished && !action.is_dummy)
            .sort((a, b) => b.order - a.order);

        if (!finishedActions.length) {
            return { updatedActionIds: [] };
        }

        const maxOrder = finishedActions[0].order;
        const changedActionIds = new Set();

        this.#actions.forEach(action => {
            if (action.order < maxOrder && !action.finished  && !action.is_dummy) {
                action.finished = true;
                changedActionIds.add(action.id);
            }
        });

        if (changedActionIds.size > 0) {
            this.#updateSteps();
            this.#updateUI(false, { changed: true, changedActionIds, orderChanged: false });
        }

        return { updatedActionIds: Array.from(changedActionIds) };
    }

    /**
     * Updates the UI based on changes.
     * @private
     * @param {boolean} courseChanged - Whether course data changed.
     * @param {Object} actionChangeInfo - Action change information.
     */
    #updateUI(courseChanged, { changed, changedActionIds, orderChanged }) {
        if (courseChanged) {
            this.#updateCourseStyles();
        }
        if (changed) {
            this.#updateActionElements(changedActionIds, orderChanged);
        }
    }

    /**
     * Updates course-related styles.
     * @private
     */
    #updateCourseStyles() {
        document.body.style.setProperty('--bg-body', this.#course.bg_color);
    }

    /**
     * Updates action elements in the UI.
     * @private
     * @param {Set} changedActionIds - IDs of changed actions.
     * @param {boolean} orderChanged - Whether action order changed.
     */
    #updateActionElements(changedActionIds, orderChanged) {
        if (orderChanged || this.#domReferences.actionElements.size !== this.#steps.length) {
            this.#domReferences.wrapper.innerHTML = '';
            this.#domReferences.actionElements.clear();
            this.#steps.forEach((step, index) => {
                const actionElement = this.#createActionElement(step, index);
                this.#domReferences.actionElements.set(step.action.actionId, actionElement);
                this.#domReferences.wrapper.appendChild(actionElement);
            });
        } else {
            this.#steps.forEach((step, index) => {
                const actionId = step.action.actionId;
                const action = this.#actions.find(a => a.internalId === actionId);
                if (!action) return;

                const shouldUpdate = changedActionIds.has(action.id) || !this.#domReferences.actionElements.has(actionId);
                
                if (shouldUpdate) {
                    let actionElement = this.#domReferences.actionElements.get(actionId);
                    if (!actionElement) {
                        actionElement = this.#createActionElement(step, index);
                        this.#domReferences.actionElements.set(actionId, actionElement);
                        const currentElements = Array.from(this.#domReferences.wrapper.children);
                        if (index < currentElements.length) {
                            this.#domReferences.wrapper.insertBefore(actionElement, currentElements[index]);
                        } else {
                            this.#domReferences.wrapper.appendChild(actionElement);
                        }
                    } else {
                        this.#updateActionElement(actionElement, step);
                    }
                }
            });

            const currentActionIds = new Set(this.#steps.map(step => step.action.actionId));
            this.#domReferences.actionElements.forEach((element, id) => {
                if (!currentActionIds.has(id)) {
                    element.remove();
                    this.#domReferences.actionElements.delete(id);
                }
            });
        }
    }

    /**
     * Updates a single action element.
     * @private
     * @param {HTMLElement} element - Element to update.
     * @param {Object} step - Step configuration.
     */
    #updateActionElement(element, step) {
        const { task, taskIcon, titleAction, subTitleAction, animal, actionWrapper, textElement, footprint } = this.#cacheDomReferences(element);
        if (element.className !== step.className) element.className = step.className;
        task.classList.toggle('tutorial-task--done', step.completed);
        if (taskIcon && taskIcon.src !== step.action.icon) taskIcon.src = step.action.icon;
        if (titleAction && titleAction.innerHTML !== step.action.title) titleAction.innerHTML = step.action.title;
        if (subTitleAction && subTitleAction.innerHTML !== (step.action.sub_title ?? '')) subTitleAction.innerHTML = step.action.sub_title ?? '';

        if (animal) {
            animal.style.display = step.action.animalVisible ? 'flex' : 'none';
            const animals = document.querySelectorAll('.tutorial-animal');
            const nextActionIndex = this.#findNextActionIndex();
            animals.forEach((el, idx) => {
                const adjustedIndex = this.#hasValidFirstAction ? idx : idx + 1;
                el.style.display = adjustedIndex === nextActionIndex && !this.#steps[adjustedIndex].action.is_dummy ? 'flex' : 'none';
            });
        }

  
        if ((step.text && !step.includeTask) || step.isFirst) {
            if (!textElement) {
                actionWrapper.appendChild(createElement('div', { className: 'tutorial-text', textContent: step.text }));
            } else if (textElement.textContent !== step.text) {
                textElement.textContent = step.text;
            }
        } else if (textElement) {
            textElement.remove();
        }

        if (footprint && step.footer.type === 'footprint') {
            const footprintInner = footprint.querySelector('.tutorial-action-footprint-inner');
            const newClassName = `tutorial-action-footprint-inner ${step.completed ? 'finished' : 'unfinished'} direction-${step.footer.foot.direction}`;
            if (footprintInner.className !== newClassName) {
                footprintInner.className = newClassName;
            }
            footprintInner.querySelectorAll('img').forEach(img => {
                if (img.src !== step.footer.foot.src) img.src = step.footer.foot.src;
            });
        } else if (footprint && step.footer.type === 'flag') {
            const flagImg = footprint.querySelector('.img-flag img');
            if (flagImg.src !== step.footer.src) flagImg.src = step.footer.src;
            let flagText = footprint.querySelector('.tutorial-text');
            if (step.footer.text) {
                if (!flagText) {
                    flagText = createElement('div', { className: 'tutorial-text', textContent: step.footer.text });
                    footprint.appendChild(flagText);
                } else if (flagText.textContent !== step.footer.text) {
                    flagText.textContent = step.footer.text;
                }
            } else if (flagText) {
                flagText.remove();
            }
        }
    }

    /**
     * Caches DOM references for an action element.
     * @private
     * @param {HTMLElement} element - Action element.
     * @returns {Object} Cached DOM references.
     */
    #cacheDomReferences(element) {
        const task = element.querySelector('.tutorial-task');
        return {
            task,
            taskIcon: task?.querySelector('.task-icon img'),
            titleAction: task?.querySelector('.title-action'),
            subTitleAction: task?.querySelector('.sub-title-action'),
            animal: task?.querySelector('.tutorial-animal'),
            actionWrapper: element.querySelector('.tutorial-action-wrapper'),
            textElement: element.querySelector('.tutorial-action-wrapper .tutorial-text'),
            footprint: element.querySelector('.tutorial-action-footprint, .tutorial-flag-end'),
        };
    }

    /**
     * Sends a postMessage to the parent context.
     * @private
     * @param {string} type - Message type.
     * @param {Object} data - Message data.
     */
    postMessage(type, data) {
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

    /**
     * Validates an action object.
     * @private
     * @param {Object} action - Action to validate.
     * @returns {boolean} Whether the action is valid.
     */
    #isValidAction(action) {
        return action && typeof action === 'object' && action.id && action.title;
    }

    /**
     * Converts physical pixels to viewport height (vh).
     * @private
     * @param {number} physicalPixels - Physical pixels.
     * @param {string} resolution - Resolution in "widthxheight" format.
     * @param {number} [dpr=3] - Device pixel ratio.
     * @returns {number} Viewport height value.
     */
    #convertPhysicalPixelsToVh(physicalPixels, resolution, dpr = 3) {
        if (typeof physicalPixels !== 'number' || physicalPixels < 0) {
            throw new Error('Physical pixels must be a non-negative number');
        }
        if (typeof resolution !== 'string' || !/^\d+x\d+$/.test(resolution)) {
            throw new Error('Resolution must be in "widthxheight" format');
        }

        const [, physicalHeight] = resolution.split('x').map(Number);
        const viewportHeight = physicalHeight / dpr;
        const cssPixels = physicalPixels / dpr;
        return Number(((cssPixels / viewportHeight) * 100).toFixed(2));
    }

    /**
     * Creates the main container for the tutorial.
     * @private
     */
    #createContainer() {
        if (this.#type.toLowerCase() === 'ios' && this.#heightTopLayout && this.#resolution) {
            const heightTopLayout = this.#convertPhysicalPixelsToVh(this.#heightTopLayout, this.#resolution, window.devicePixelRatio || 3);
            console.log(this.#heightTopLayout);
            document.body.style.setProperty('--height-top-layout', `${heightTopLayout}vh`);
        }
        document.body.classList.add( 
                this.#type.toLowerCase() === 'ios' ? 'use-ios' : 'use-android')
        document.body.style.setProperty('--bg-body', this.#course.bg_color || '#ffffff');
        document.body.style.setProperty('--pb-body', this.#padding_bottom ? '10px' : '0' );

        this.#container = createElement('div', {
            className: 'tutorial'
        });
        document.body.appendChild(this.#container);
    }

    /**
     * Initializes the UI structure.
     * @private
     */
    #initializeUI() {
        this.#domReferences.wrapperInner = createElement('div', { className: 'tutorial-wrapper-inner' });
        this.#domReferences.wrapper = createElement('div', { className: 'tutorial-wrapper' });

        this.#steps.forEach((step, index) => {
            const actionElement = this.#createActionElement(step, index);
            this.#domReferences.actionElements.set(step.action.actionId, actionElement);
            this.#domReferences.wrapper.appendChild(actionElement);
        });

        this.#domReferences.firstImg = this.#createDecorativeImage('first', `${this.#course.illus_assets}${this.#course.illustration}/items/${this.#animal_icons[0]}.png`);
        this.#domReferences.secondImg = this.#createDecorativeImage('second', `${this.#course.illus_assets}${this.#course.illustration}/items/${this.#animal_icons[1]}.png`);

        this.#domReferences.wrapperInner.append(
            this.#domReferences.wrapper,
            this.#domReferences.firstImg,
            this.#domReferences.secondImg
        );

        this.#container.appendChild(this.#domReferences.wrapperInner);
    }

    /**
     * Creates an action element for a step.
     * @private
     * @param {Object} step - Step configuration.
     * @param {number} index - Step index.
     * @returns {HTMLElement} Action element.
     */
    #createActionElement(step, index) {
        try {
            const action = createElement('div', { className: step.className, 'data-total-action': this.#actions.length, });
            const actionWrapper = createElement('div', { className: 'tutorial-action-wrapper' });

            if(step.includeTask) {
                actionWrapper.appendChild(this.#createActionLabel(step.action, step.isFirst));
            }

            if (step.text) {
                actionWrapper.appendChild(createElement('div', {
                    className: 'tutorial-text',
                    textContent: step.text
                }));
            }
            action.append(actionWrapper, this.#createFootPrint(step, index));
            return action;
        } catch (error) {
            console.error(`Error creating action element for actionId: ${step.action.actionId}`, error);
            throw error;
        }
    }

    /**
     * Creates an action label element.
     * @private
     * @param {Object} action - Action data.
     * @param {boolean} isFirst - Whether this is the first action.
     * @returns {HTMLElement} Action label element.
     */
    #createActionLabel(action, isFirst) {
        console.log(action)
        const actionItem = createElement('div', {
            //className: 'tutorial-task',
            className: `tutorial-task ${isFirst ? 'tutorial-task--first' : ''}`,
            events: { click: () => this.#evtHandleAction(action.actionId) },
        });
        actionItem.style.setProperty('--bg-action', action.bg_color ?? '#FFFFFF');

        actionItem.append(
            this.#createAnimalElement(action.animal, action.animalVisible),
            this.#createCheckmarkElement(isFirst),
            this.#createTaskInnerElement(action.icon, action.title, action.sub_title)
        );
        return actionItem;
    }

    /**
     * Creates an animal element.
     * @private
     * @param {string} animalSrc - Source URL for animal image.
     * @param {boolean} isVisible - Whether the animal is visible.
     * @returns {HTMLElement} Animal element.
     */
    #createAnimalElement(animalSrc, isVisible) {
        const animalDiv = createElement('div', {
            className: 'tutorial-animal',
            'data-total-action': this.#actions.length,
            style: { display: isVisible ? 'flex' : 'none' }
        });
        animalDiv.appendChild(this.#createImage(animalSrc));
        return animalDiv;
    }

    /**
     * Creates inner task element with icon and text.
     * @private
     * @param {string} icon - Icon URL.
     * @param {string} title - Action title.
     * @param {string} sub_title - Action subtitle.
     * @returns {HTMLElement} Task inner element.
     */
    #createTaskInnerElement(icon, title, sub_title) {
        const inner = createElement('div', { className: 'tutorial-task-inner' });

        if (icon) {
            const iconDiv = createElement('div', { className: 'task-icon' });
            iconDiv.appendChild(this.#createImage(icon));
            inner.appendChild(iconDiv);
        }

        const taskContentDiv = createElement('div', { className: 'task-content' });
        taskContentDiv.append(
            createElement('small', { className: 'sub-title-action', innerHTML: sub_title ?? '' }),
            createElement('span', { className: 'title-action', innerHTML: title })
        );

        inner.appendChild(taskContentDiv);
        return inner;
    }

    /**
     * Creates a checkmark element.
     * @private
     * @param {boolean} isFirst - Whether this is the first action.
     * @returns {HTMLElement} Checkmark element.
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
     * Creates a decorative image element.
     * @private
     * @param {string} position - Position of the image ('first' or 'second').
     * @param {string} src - Image source URL.
     * @returns {HTMLElement} Decorative image element.
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
     * Creates a footprint or flag element for a step.
     * @private
     * @param {Object} step - Step configuration.
     * @param {number} index - Step index.
     * @returns {HTMLElement} Footprint or flag element.
     */
    #createFootPrint({ footer, completed }, index) {
        return footer.type === 'footprint'
            ? this.#createFootprintElement(footer, completed, index)
            : this.#createFlagElement(footer);
    }

    /**
     * Creates a footprint element.
     * @private
     * @param {Object} footer - Footer configuration.
     * @param {boolean} completed - Whether the step is completed.
     * @param {number} index - Step index.
     * @returns {HTMLElement} Footprint element.
     */
    #createFootprintElement(footer, completed, index) {
        const { className, foot } = footer;
        const footprint = createElement('div', {
            className: `tutorial-action-footprint ${className}`,
            'data-total-action': this.#actions.length
        });

        const inner = createElement('div', {
            className: `tutorial-action-footprint-inner ${completed ? 'finished' : 'unfinished'} direction-${foot.direction}`
        });

        for (let i = 0; i < foot.count; i++) {
            inner.appendChild(this.#createImage(foot.src));
        }

        footprint.appendChild(inner);
        return footprint;
    }

    /**
     * Creates a flag element.
     * @private
     * @param {Object} footer - Footer configuration.
     * @returns {HTMLElement} Flag element.
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
     * Creates an image element.
     * @private
     * @param {string} src - Image source URL.
     * @returns {HTMLElement} Image element.
     */
    #createImage(src) {
        return createElement('img', { src, alt: '' });
    }

    /**
     * Checks if previous actions are completed.
     * @private
     * @param {number} actionIndex - Index of the action to check.
     * @returns {boolean} Whether previous actions are completed.
     */
    #isPreviousComplete(actionIndex) {
        return this.#actions.slice(0, actionIndex).every(action => action.finished || action.is_dummy);
    }

    /**
     * Handles action click events.
     * @private
     * @param {string} actionId - ID of the action.
     */
    #evtHandleAction(actionId) {
        const actionIndex = this.#actions.findIndex(a => a.internalId === actionId);
        if (actionIndex === -1 || this.#actions[actionIndex].is_dummy) return;
        const action = this.#actions[actionIndex];
        this.postMessage('openTask', {
            actionId: action.id,
            is_first_action: action.is_first_action ?? false,
            isValid: this.#isPreviousComplete(actionIndex)
        });
    }

    /**
     * Renders the tutorial UI.
     * @private
     * @param {boolean} courseChanged - Whether course data changed.
     * @param {Object} actionsChangedInfo - Action change information.
     */
    #render(courseChanged, actionsChangedInfo) {
        if (!this.#container) {
            this.#createContainer();
            this.#initializeUI();
        } else if (courseChanged || actionsChangedInfo.changed) {
            this.#updateUI(courseChanged, actionsChangedInfo);
        }
    }
}

const tutorial = new Tutorial();

/**
 * Initializes the tutorial app with provided data.
 * @param {Object|string} data - Initial data or JSON string.
 * @returns {boolean} Whether initialization was successful.
 */
window.initTutorialApp = function (data) {
    let error = null;
    let isSuccess = false;
    try {
        tutorial.init(data);
        isSuccess = true;
    } catch (err) {
        error = err.message;
    }
    tutorial.postMessage('loadFinished', { error, success: isSuccess });
    return isSuccess;
};

tutorial.postMessage('javascriptLoaded', { success: true });

window.initTutorialApp({
    "type": "Android",
    "device": "iPhone13",
    "data": {
        "next_consulting": {},
        "id": "14",
        "title": "swift flow_chart",
        "date": "2025/07/07",
        "bg_color": "#f6fcf2",
        "title_color": "",
        "survey": "SWFIT flow chart",
        "icon": "https://www.test.learningpocket.com/uploads/course/v5a5B1VEco/N874lapmA6ok91en.png",
        "illustration": "dog",
        "count_action": 6,
        "total_action": 6,
        "type": "FLOW_CHART",
        "progress_notify": "ぽけっとを使ってみよう！",
        "progress_msg": "コンプリートまであと__percent__%！",
        "illus_assets": "https://test.learningpocket.com/assets/images/tutorials/",
        "html": "https://www.test.learningpocket.com/tutorials/index.html",
        "animal_icons": [
            1,
            3
        ],
        "first_action": {
            "id": "3",
            "icon": "https://www.test.learningpocket.com/uploads/course/first_action/06Z8M9fnj6pkw118.png",
            "thumb": "https://test.learningpocket.com/assets/images/tutorials/complete.png",
            "answer": "first-action3",
            "title": "first-action3",
            "bg_color": "#f5f3ff",
            "bd_color": "#c2bbe8",
            "spec_content": "",
            "method_redirect": "top_access",
            "cate_content": "ACCESS",
            "target_page": "career-consulting",
            "finished": true,
            "disabled": false
        },
        "actions": [
            {
                "id": "26",
                "icon": "https://test.learningpocket.com/assets/images/tutorials/excel.jpg",
                "title": "column columncolumnc",
                "sub_title": "columncolumncolumnco columncolumncolumnco",
                "thumb": "https://test.learningpocket.com/assets/images/tutorials/complete.png",
                "bg_color": "#f6fcf2",
                "bd_color": "#cfe6c0",
                "order": 1,
                "count_task": 3,
                "finished": true,
                "tasks": [
                    {
                        "id": "251",
                        "title": "columncolumncolumnco",
                        "thumb": "https://www.test.learningpocket.com/uploads/course/v5a5B1VEco/SpOdLeZbU7Rkr1kG.png",
                        "spec_content": "Test",
                        "method_redirect": "819",
                        "cate_content": "SPECIAL",
                        "target_page": "examination",
                        "order": 1,
                        "finished": true
                    },
                    {
                        "id": "252",
                        "title": "top page column aaaa",
                        "thumb": "https://www.test.learningpocket.com/uploads/course/v5a5B1VEco/Fpvd6eIbC7lkH1LY.png",
                        "spec_content": "Test",
                        "method_redirect": "819",
                        "cate_content": "SPECIAL",
                        "target_page": "examination",
                        "order": 2,
                        "finished": true
                    }
                ]
            },
            {
                "id": "25",
                "icon": "https://test.learningpocket.com/assets/images/tutorials/excel.jpg",
                "title": "career consulting columncolumncolumnco",
                "sub_title": "career-consulting aa",
                "thumb": "https://test.learningpocket.com/assets/images/tutorials/complete.png",
                "bg_color": "#f6fcf2",
                "bd_color": "#cfe6c0",
                "order": 2,
                "count_task": 2,
                "finished": false,
                "tasks": [
                    {
                        "id": "249",
                        "title": "TOP career-consultin",
                        "thumb": null,
                        "spec_content": "",
                        "method_redirect": "page_access",
                        "cate_content": "ACCESS",
                        "target_page": "column",
                        "order": 1,
                        "finished": true
                    },
                    {
                        "id": "250",
                        "title": "top page career-cons",
                        "thumb": null,
                        "spec_content": "column",
                        "method_redirect": "435",
                        "cate_content": "SPECIAL",
                        "target_page": "column",
                        "order": 2,
                        "finished": true
                    }
                ]
            },
            // {
            //     "id": "24",
            //     "icon": "https://test.learningpocket.com/assets/images/tutorials/excel.jpg",
            //     "title": "material columncolumncolumnco columncolumncolumnco",
            //     "sub_title": "go to material",
            //     "thumb": "https://test.learningpocket.com/assets/images/tutorials/complete.png",
            //     "bg_color": "#f6fcf2",
            //     "bd_color": "#cfe6c0",
            //     "order": 3,
            //     "count_task": 3,
            //     "finished": true,
            //     "tasks": [
            //         {
            //             "id": "246",
            //             "title": "TOP Material aaaaaaa",
            //             "thumb": "https://www.test.learningpocket.com/uploads/course/v5a5B1VEco/A7qaUaymF6Ckw1Iz.png",
            //             "spec_content": "",
            //             "method_redirect": "top_access",
            //             "cate_content": "ACCESS",
            //             "target_page": "document",
            //             "order": 1,
            //             "finished": true
            //         },
            //         {
            //             "id": "247",
            //             "title": "top page material aa",
            //             "thumb": null,
            //             "spec_content": "",
            //             "method_redirect": "page_access",
            //             "cate_content": "ACCESS",
            //             "target_page": "lesson",
            //             "order": 2,
            //             "finished": true
            //         },
            //         {
            //             "id": "248",
            //             "title": "detial material aaaa",
            //             "thumb": null,
            //             "spec_content": "Test Material Video",
            //             "method_redirect": "364",
            //             "cate_content": "SPECIAL",
            //             "target_page": "document",
            //             "order": 3,
            //             "finished": true
            //         }
            //     ]
            // },
            // {
            //     "id": "390",
            //     "icon": "https://test.learningpocket.com/assets/images/tutorials/video.jpg",
            //     "title": "c",
            //     "sub_title": "t",
            //     "thumb": "https://test.learningpocket.com/assets/images/tutorials/complete.png",
            //     "bg_color": "#f2fcf4",
            //     "bd_color": "#c0e6c7",
            //     "order": 4,
            //     "count_task": 1,
            //     "finished": true,
            //     "tasks": [
            //         {
            //             "id": "2381",
            //             "title": "test 5",
            //             "thumb": "https://www.test.learningpocket.com/uploads/course/v5a5B1VEco/ReIcEsysvaTkZ1pQ.png",
            //             "spec_content": "",
            //             "method_redirect": "top_access",
            //             "cate_content": "ACCESS",
            //             "target_page": "column",
            //             "order": 1,
            //             "finished": true
            //         }
            //     ]
            // },
            // {
            //     "id": "391",
            //     "icon": "https://test.learningpocket.com/assets/images/tutorials/video.jpg",
            //     "title": "column 6 column 6column 6column 6",
            //     "sub_title": "test 6",
            //     "thumb": "https://test.learningpocket.com/assets/images/tutorials/complete.png",
            //     "bg_color": "#fffcf5",
            //     "bd_color": "#e8ddc2",
            //     "order": 5,
            //     "count_task": 1,
            //     "finished": false,
            //     "tasks": [
            //         {
            //             "id": "2382",
            //             "title": "test 6",
            //             "thumb": "https://www.test.learningpocket.com/uploads/course/v5a5B1VEco/G0vdUsosIarku1f6.png",
            //             "spec_content": "",
            //             "method_redirect": "top_access",
            //             "cate_content": "ACCESS",
            //             "target_page": "diagnostic-content",
            //             "order": 1,
            //             "finished": false
            //         }
            //     ]
            // },
            // {
            //     "id": "392",
            //     "icon": "https://test.learningpocket.com/assets/images/tutorials/video.jpg",
            //     "title": "test 7",
            //     "sub_title": "test 7",
            //     "thumb": "https://test.learningpocket.com/assets/images/tutorials/complete.png",
            //     "bg_color": "#ffffff",
            //     "bd_color": "",
            //     "order": 6,
            //     "count_task": 1,
            //     "finished": false,
            //     "tasks": [
            //         {
            //             "id": "2383",
            //             "title": "test 7",
            //             "thumb": null,
            //             "spec_content": "",
            //             "method_redirect": "top_access",
            //             "cate_content": "ACCESS",
            //             "target_page": "career-consulting",
            //             "order": 1,
            //             "finished": false
            //         }
            //     ]
            // }
        ]
    },
    "height_top_layout": 150,
    "resolution": "1170x2532",
    "padding_bottom": "true"
});
})();