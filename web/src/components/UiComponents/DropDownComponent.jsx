import React, { useState } from 'react';
import { Dropdown } from 'react-bootstrap';
import styles from "./UiComponents.module.css";
import { IoIosArrowDown } from 'react-icons/io';

const CustomDropdown = ({ toggleElement, menuItems, align = 'start', icon = true, inSideClickClose = true, }) => {
    const [show, setShow] = useState(false);

    const handleMenuItemClick = () => {
        setShow(false);
    };

    const enhancedMenuItems = React.Children.map(menuItems, child => {
        return React.cloneElement(child, {
            onClick: (e) => {
                if (child.props.onClick) {
                    child.props.onClick(e);
                }
                if (inSideClickClose) {
                    handleMenuItemClick();
                }
            }
        });
    });

    return (
        <Dropdown
            className={`defaultDropdownStyle ${styles.defaultDropdownStyle}`}
            show={show}
            onToggle={setShow}
        >
            <Dropdown.Toggle variant="light" id="dropdown-basic">
                {toggleElement}
                {icon && <span className='dropdownArrowIcon'>
                    <IoIosArrowDown />
                </span>}
            </Dropdown.Toggle>
            <Dropdown.Menu align={align}>
                {enhancedMenuItems}
            </Dropdown.Menu>
        </Dropdown>
    );
};

export default CustomDropdown;



// import { Dropdown } from 'react-bootstrap';
// import styles from "./UiComponents.module.css";
// import { IoIosArrowDown } from 'react-icons/io';

// const CustomDropdown = ({ toggleElement, menuItems, align = 'start', icon = true, defaultShow }) => {
//     return (
//         <Dropdown show={defaultShow} className={`defaultDropdownStyle ${styles.defaultDropdownStyle} `}>
//             <Dropdown.Toggle variant="light" id="dropdown-basic">
//                 {toggleElement}

//                 {icon && <span className='dropdownArrowIcon'>
//                     <IoIosArrowDown />
//                 </span>}

//             </Dropdown.Toggle>
//             <Dropdown.Menu align={align}>
//                 {menuItems}
//             </Dropdown.Menu>
//         </Dropdown>
//     );
// };

// export default CustomDropdown;