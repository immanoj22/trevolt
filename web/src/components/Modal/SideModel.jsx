import React, { useState } from 'react'
import { Offcanvas } from 'react-bootstrap'
import styles from './modal.module.css';
import { IoIosClose } from 'react-icons/io';
import Button from '../Button/Button';

function SideModel({ show, title = "SideModel", handleClose, children }) {
    return (
        <Offcanvas
            show={show}
            className={`${styles.notificationOffcanva}`}
            placement={'end'}
            onHide={handleClose}
        >
            <Offcanvas.Header className={`${styles.headSection}`}>
                <Offcanvas.Title className='w-100'>
                    <div className='w-100 d-flex gap-2 align-items-center justify-content-between'>
                        <h3 className={`${styles.title} fs18 m-0`}>{title}</h3>
                        <Button className='cardBtnRectangleXs' staticClass='p-0' btnText={null} onClick={handleClose} reactIconElement={<IoIosClose size={30} />} />
                    </div>
                </Offcanvas.Title>
            </Offcanvas.Header>
            <Offcanvas.Body className={`${styles.canvaBody} position-relative`} >
                {children}
            </Offcanvas.Body>
        </Offcanvas>
    )
}

export default SideModel