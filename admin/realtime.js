export function handleListingChange(payload) {
    const { eventType, new: newRecord, old: oldRecord } = payload;
    
    switch (eventType) {
        case 'INSERT':
            addListingToTable(newRecord);
            break;
        case 'UPDATE':
            updateListingInTable(newRecord);
            break;
        case 'DELETE':
            removeListingFromTable(oldRecord.id);
            break;
    }
}

export function handleUserChange(payload) {
    const { eventType, new: newRecord, old: oldRecord } = payload;
    
    switch (eventType) {
        case 'INSERT':
            addUserToTable(newRecord);
            break;
        case 'UPDATE':
            updateUserInTable(newRecord);
            break;
        case 'DELETE':
            removeUserFromTable(oldRecord.id);
            break;
    }
}

export function handlePaymentChange(payload) {
    const { eventType, new: newRecord, old: oldRecord } = payload;
    
    switch (eventType) {
        case 'INSERT':
            addPaymentToTable(newRecord);
            break;
        case 'UPDATE':
            updatePaymentInTable(newRecord);
            break;
        case 'DELETE':
            removePaymentFromTable(oldRecord.id);
            break;
    }
} 