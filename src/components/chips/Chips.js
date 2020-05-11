import React, {Component} from 'react';
import PropTypes from 'prop-types';
import ReactDOM from 'react-dom';
import {InputText} from '../inputtext/InputText';
import DomHandler from '../utils/DomHandler';
import classNames from 'classnames';
import Tooltip from "../tooltip/Tooltip";

export class Chips extends Component {

    static defaultProps = {
        id: null,
        name: null,
        placeholder: null,
        value: null,
        max: null,
        disabled: null,
        style: null,
        className: null,
        tooltip: null,
        tooltipOptions: null,
        ariaLabelledBy: null,
        separator: null,
        allowDuplicate: true,
        itemTemplate: null,
        onAdd: null,
        onRemove: null,
        onChange: null,
        onFocus: null,
        onBlur: null
    }

    static propTypes = {
        id: PropTypes.string,
        name: PropTypes.string,
        placeholder: PropTypes.string,
        value: PropTypes.array,
        max: PropTypes.number,
        disabled: PropTypes.bool,
        style: PropTypes.object,
        className: PropTypes.string,
        tooltip: PropTypes.string,
        tooltipOptions: PropTypes.object,
        ariaLabelledBy: PropTypes.string,
        separator: PropTypes.string,
        allowDuplicate: PropTypes.bool,
        itemTemplate: PropTypes.func,
        onAdd: PropTypes.func,
        onRemove: PropTypes.func,
        onChange: PropTypes.func,
        onFocus: PropTypes.func,
        onBlur: PropTypes.func
    }

    constructor(props) {
        super(props);
        this.focusInput = this.focusInput.bind(this);
        this.onKeyDown = this.onKeyDown.bind(this);
        this.onPaste = this.onPaste.bind(this);
        this.onFocus = this.onFocus.bind(this);
        this.onBlur = this.onBlur.bind(this);
    }

    componentDidMount() {
        if (this.props.tooltip) {
            this.renderTooltip();
        }
    }

    componentDidUpdate(prevProps) {
        let isValueSame = this.props.value && prevProps.value.length === this.props.value.length;
        if (this.props.tooltip) {
            if (prevProps.tooltip !== this.props.tooltip) {
                if (this.tooltip)
                    this.tooltip.updateContent(this.props.tooltip);
                else
                    this.renderTooltip();
            }
            else if (!isValueSame && this.tooltip) {
                this.tooltip.deactivate();
                this.tooltip.activate();
            }
        }
    }

    componentWillUnmount() {
        if (this.tooltip) {
            this.tooltip.destroy();
            this.tooltip = null;
        }
    }

    renderTooltip() {
        this.tooltip = new Tooltip({
            target: this.inputElement,
            targetContainer: this.listElement,
            content: this.props.tooltip,
            options: this.props.tooltipOptions
        });
    }

    removeItem(event, index) {
        if (this.props.disabled) {
            return;
        }

        let values = [...this.props.value];
        const removedItem = values.splice(index, 1);

        if (this.props.onRemove) {
            this.props.onRemove({
                originalEvent: event,
                value: removedItem
            });
        }

        if (this.props.onChange) {
            this.props.onChange({
                originalEvent: event,
                value: values,
                stopPropagation : () =>{},
                preventDefault : () =>{},
                target: {
                    name: this.props.name,
                    id: this.props.id,
                    value : values
                }
            });
        }
    }

    addItem(event, item, preventDefault) {
        if (item && item.trim().length) {
            let values = this.props.value ? [...this.props.value] : [];

            if (this.props.allowDuplicate || values.indexOf(item) === -1) {
                values.push(item);

                if (this.props.onAdd) {
                    this.props.onAdd({
                        originalEvent: event,
                        value: item
                    });
                }
            }
            this.updateInput(event, values, preventDefault)
        }

    }

    focusInput() {
        this.focus = true;
        this.inputElement.focus();
    }

    onKeyDown(event) {
        const inputValue = event.target.value;

        switch(event.which) {
            //backspace
            case 8:
                if (this.inputElement.value.length === 0 && this.props.value && this.props.value.length > 0) {
                    this.removeItem(event, this.props.value.length - 1);
                }
            break;

            //enter
            case 13:
                if (inputValue && inputValue.trim().length && (!this.props.max || this.props.max > this.props.value.length)) {
                    this.addItem(event, inputValue, true);
                }
            break;

            default:
                if (this.isMaxedOut()) {
                    event.preventDefault();
                }
                else if (this.props.separator) {
                    if (this.props.separator === ',' && event.which === 188) {
                        this.addItem(event, inputValue, true);
                    }
                }
            break;
        }
    }

    updateInput(event, items, preventDefault) {
        if (this.props.onChange) {
            this.props.onChange({
                originalEvent: event,
                value: items,
                stopPropagation : () =>{},
                preventDefault : () =>{},
                target: {
                    name: this.props.name,
                    id: this.props.id,
                    value : items
                }
            });
        }

        this.inputElement.value = '';

        if (preventDefault) {
            event.preventDefault();
        }
    }

    onPaste(event) {
        if (this.props.separator) {
            let pastedData = (event.clipboardData || window['clipboardData']).getData('Text');

            if (pastedData) {
                let values = this.props.value || [];
                let pastedValues = pastedData.split(this.props.separator);
                pastedValues = pastedValues.filter(val => ((this.props.allowDuplicate || values.indexOf(val) === -1) && val.trim().length));
                values = [...values, ...pastedValues];

                this.updateInput(event, values, true)
            }

        }
    }

    onFocus(event) {
        this.focus = true;

        DomHandler.addClass(this.listElement, 'p-focus');
        if (this.props.onFocus) {
            this.props.onFocus(event);
        }
    }

    onBlur(event) {
        this.focus = false;

        DomHandler.removeClass(this.listElement, 'p-focus');
        if (this.props.onBlur) {
            this.props.onBlur(event);
        }
    }

    isMaxedOut() {
        return this.props.max && this.props.value && this.props.max === this.props.value.length;
    }

    renderItem(value, index) {
        const content = this.props.itemTemplate ? this.props.itemTemplate(value) : value;
        const icon = this.props.disabled ? null : <span className="p-chips-token-icon pi pi-fw pi-times" onClick={(event) => this.removeItem(event, index)}></span>;

        return (
            <li key={index} className="p-chips-token p-highlight">
                {icon}
                <span className="p-chips-token-label">{content}</span>
            </li>
        );
    }

    renderInputElement() {
        return (
            <li className="p-chips-input-token">
                <InputText ref={(el) => this.inputElement = ReactDOM.findDOMNode(el)} placeholder={this.props.placeholder} type="text" name={this.props.name} disabled={this.props.disabled||this.isMaxedOut()}
                            onKeyDown={this.onKeyDown} onPaste={this.onPaste} onFocus={this.onFocus} onBlur={this.onBlur} aria-labelledby={this.props.ariaLabelledBy}/>
            </li>
        );
    }

    renderItems() {
        if (this.props.value) {
            return this.props.value.map((value, index) => {
                return this.renderItem(value, index);
            });
        }
        else {
            return null;
        }
    }

    renderList() {
        const className = classNames('p-inputtext', {'p-disabled': this.props.disabled});
        const items = this.renderItems();
        const inputElement = this.renderInputElement();

        if (this.props.value) {
            return (
                <ul ref={(el) => this.listElement = el} className={className} onClick={this.focusInput}>
                    {items}
                    {inputElement}
                </ul>
            );
        }
        else {
            return null;
        }
    }

    render() {
        const className = classNames('p-chips p-component', this.props.className, {
            'p-inputwrapper-filled': this.props.value.length > 0 || (DomHandler.hasClass(this.inputElement, 'p-filled') && this.inputElement.value !== ''),
            'p-inputwrapper-focus': this.focus});
        const list = this.renderList();

        return (
            <div ref={(el) => this.element = el} id={this.props.id} className={className} style={this.props.style}>
                {list}
            </div>
        );
    }
}
