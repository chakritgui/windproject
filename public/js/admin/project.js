$(document).ready(function() {
    let currentFolderId = 1;
    let currentPath = [{id: 1, name: 'ไดรฟ์ของฉัน'}];
    let items = [
        {id: 1, name: 'ไดรฟ์ของฉัน', type: 'folder', parentId: null},
        {id: 2, name: 'เอกสารสำคัญ', type: 'folder', parentId: 1, createdAt: '2024-01-15'},
        {id: 3, name: 'รูปภาพ', type: 'folder', parentId: 1, createdAt: '2024-01-14'},
        {id: 4, name: 'โครงการ A', type: 'folder', parentId: 1, createdAt: '2024-01-13'},
        {id: 5, name: 'บันทึก.txt', type: 'file', parentId: 1, content: 'นี่คือเนื้อหาตัวอย่าง', createdAt: '2024-01-12'},
        {id: 6, name: 'สัญญา.txt', type: 'file', parentId: 2, content: 'เนื้อหาสัญญา...', createdAt: '2024-01-16'},
        {id: 7, name: 'รายงาน.txt', type: 'file', parentId: 2, content: 'เนื้อหารายงาน...', createdAt: '2024-01-17'},
    ];
    let nextId = 8;
    loadItems();
    $('#viewGrid').click(function() {
        $('#gridView').removeClass('d-none');
        $('#listView').addClass('d-none');
        $(this).addClass('active');
        $('#viewList').removeClass('active');
    });
    $('#viewList').click(function() {
        $('#listView').removeClass('d-none');
        $('#gridView').addClass('d-none');
        $(this).addClass('active');
        $('#viewGrid').removeClass('active');
        loadListView();
    });
    $('#btnNew, #btnCreateFolder').click(function() {
        $('#folderName').val('');
        $('#modalCreateFolder').modal('show');
    });
    $('#btnSaveFolder').click(function() {
        const folderName = $('#folderName').val().trim();
        if (folderName === '') {
            alert('กรุณาใส่ชื่อโฟลเดอร์');
            return;
        }
        const newFolder = {
            id: nextId++,
            name: folderName,
            type: 'folder',
            parentId: currentFolderId,
            createdAt: new Date().toISOString().split('T')[0]
        };
        items.push(newFolder);
        $('#modalCreateFolder').modal('hide');
        loadItems();
        showToast('สร้างโฟลเดอร์ "' + folderName + '" สำเร็จ');
    });
    $('#btnCreateFile').click(function() {
        $('#fileName').val('');
        $('#fileContent').val('');
        $('#modalCreateFile').modal('show');
    });
    $('#btnSaveFile').click(function() {
        const fileName = $('#fileName').val().trim();
        const fileContent = $('#fileContent').val();
        if (fileName === '') {
            alert('กรุณาใส่ชื่อไฟล์');
            return;
        }
        const newFile = {
            id: nextId++,
            name: fileName,
            type: 'file',
            content: fileContent,
            parentId: currentFolderId,
            createdAt: new Date().toISOString().split('T')[0]
        };
        items.push(newFile);
        $('#modalCreateFile').modal('hide');
        loadItems();
        showToast('สร้างไฟล์ "' + fileName + '" สำเร็จ');
    });
    function loadItems() {
        const currentItems = items.filter(item => item.parentId === currentFolderId);
        if (currentItems.length === 0) {
            $('#gridView').html('');
            $('#emptyState').removeClass('d-none');
            return;
        }
        $('#emptyState').addClass('d-none');
        let html = '';
        currentItems.forEach(item => {
            if (item.type === 'folder') {
                html += `
                    <div class="col-lg-2 col-md-3 col-sm-4 col-6">
                        <div class="folder-card fade-in" data-id="${item.id}" data-type="folder">
                            <div class="text-center">
                                <i class="bi bi-folder-fill folder-icon"></i>
                            </div>
                            <div class="item-name" title="${item.name}">${item.name}</div>
                            <div class="item-info">${item.createdAt || '-'}</div>
                        </div>
                    </div>
                `;
            } else {
                html += `
                    <div class="col-lg-2 col-md-3 col-sm-4 col-6">
                        <div class="file-card fade-in" data-id="${item.id}" data-type="file">
                            <div class="text-center">
                                <i class="bi bi-file-earmark-text-fill file-icon"></i>
                            </div>
                            <div class="item-name" title="${item.name}">${item.name}</div>
                            <div class="item-info">${item.createdAt || '-'}</div>
                        </div>
                    </div>
                `;
            }
        });
        $('#gridView').html(html);
        attachItemEvents();
    }
    function loadListView() {
        const currentItems = items.filter(item => item.parentId === currentFolderId);
        let html = '';
        currentItems.forEach(item => {
            const icon = item.type === 'folder' 
                ? '<i class="bi bi-folder-fill text-warning me-2"></i>' 
                : '<i class="bi bi-file-earmark-text-fill text-primary me-2"></i>';
            html += `
                <tr data-id="${item.id}" data-type="${item.type}">
                    <td>${icon}${item.name}</td>
                    <td>ฉัน</td>
                    <td>${item.createdAt || '-'}</td>
                    <td>${item.type === 'folder' ? '-' : '1 KB'}</td>
                    <td>
                        <button class="btn btn-sm btn-link text-secondary">
                            <i class="bi bi-three-dots-vertical"></i>
                        </button>
                    </td>
                </tr>
            `;
        });
        $('#listViewBody').html(html);
        $('#listViewBody tr').click(function() {
            const id = $(this).data('id');
            const type = $(this).data('type');
            handleItemClick(id, type);
        });
    }
    function attachItemEvents() {
        $('.folder-card, .file-card').click(function(e) {
            const id = $(this).data('id');
            const type = $(this).data('type');
            handleItemClick(id, type);
        });
        $('.folder-card, .file-card').contextmenu(function(e) {
            e.preventDefault();
            const id = $(this).data('id');
            const type = $(this).data('type');
            showContextMenu(e.pageX, e.pageY, id, type);
        });
    }
    function handleItemClick(id, type) {
        if (type === 'folder') {
            openFolder(id);
        } else {
            openFile(id);
        }
    }
    function openFolder(folderId) {
        currentFolderId = folderId;
        const folder = items.find(item => item.id === folderId);
        const existingIndex = currentPath.findIndex(p => p.id === folderId);
        if (existingIndex !== -1) {
            currentPath = currentPath.slice(0, existingIndex + 1);
        } else {
            currentPath.push({id: folderId, name: folder.name});
        }
        updateBreadcrumb();
        loadItems();
    }
    function openFile(fileId) {
        const file = items.find(item => item.id === fileId);
        $('#viewFileTitle').text(file.name);
        $('#viewFileContent').val(file.content || '');
        $('#viewFileContent').data('file-id', fileId);
        $('#modalViewFile').modal('show');
    }
    $('#btnUpdateFile').click(function() {
        const fileId = $('#viewFileContent').data('file-id');
        const newContent = $('#viewFileContent').val();
        const file = items.find(item => item.id === fileId);
        if (file) {
            file.content = newContent;
            $('#modalViewFile').modal('hide');
            showToast('บันทึกไฟล์สำเร็จ');
        }
    });
    function updateBreadcrumb() {
        let html = '';
        currentPath.forEach((path, index) => {
            if (index === currentPath.length - 1) {
                html += `
                    <li class="breadcrumb-item active" data-id="${path.id}">
                        ${index === 0 ? '<i class="bi bi-cloud-fill me-1"></i>' : ''}
                        <span>${path.name}</span>
                    </li>
                `;
            } else {
                html += `
                    <li class="breadcrumb-item" data-id="${path.id}">
                        ${index === 0 ? '<i class="bi bi-cloud-fill me-1"></i>' : ''}
                        <span>${path.name}</span>
                    </li>
                `;
            }
        });
        $('#breadcrumb').html(html);
        $('.breadcrumb-item:not(.active)').click(function() {
            const folderId = $(this).data('id');
            openFolder(folderId);
        });
    }
    function showContextMenu(x, y, itemId, itemType) {
        $('#contextMenu').css({
            display: 'block',
            left: x + 'px',
            top: y + 'px'
        }).data('item-id', itemId).data('item-type', itemType);
    }
    $(document).click(function() {
        $('#contextMenu').hide();
    });
    $('#contextMenu .context-menu-item').click(function(e) {
        e.stopPropagation();
        const action = $(this).data('action');
        const itemId = $('#contextMenu').data('item-id');
        const itemType = $('#contextMenu').data('item-type');
        if (action === 'open') {
            handleItemClick(itemId, itemType);
        } else if (action === 'rename') {
            renameItem(itemId);
        } else if (action === 'delete') {
            deleteItem(itemId);
        }
        $('#contextMenu').hide();
    });
    function renameItem(itemId) {
        const item = items.find(i => i.id === itemId);
        const newName = prompt('ชื่อใหม่:', item.name);
        if (newName && newName.trim() !== '') {
            item.name = newName.trim();
            loadItems();
            showToast('เปลี่ยนชื่อเป็น "' + newName + '" สำเร็จ');
        }
    }
    function deleteItem(itemId) {
        const item = items.find(i => i.id === itemId);
        if (confirm('คุณต้องการลบ "' + item.name + '" หรือไม่?')) {
            const idsToDelete = [itemId];
            let i = 0;
            while (i < idsToDelete.length) {
                const children = items.filter(item => item.parentId === idsToDelete[i]);
                children.forEach(child => idsToDelete.push(child.id));
                i++;
            }
            items = items.filter(item => !idsToDelete.includes(item.id));
            loadItems();
            showToast('ลบ "' + item.name + '" สำเร็จ');
        }
    }
    function showToast(message) {
        const toastHtml = `
            <div class="toast-container position-fixed bottom-0 end-0 p-3">
                <div class="toast show" role="alert">
                    <div class="toast-header">
                        <i class="bi bi-check-circle-fill text-success me-2"></i>
                        <strong class="me-auto">สำเร็จ</strong>
                        <button type="button" class="btn-close" data-bs-dismiss="toast"></button>
                    </div>
                    <div class="toast-body">
                        ${message}
                    </div>
                </div>
            </div>
        `;
        $('body').append(toastHtml);
        setTimeout(function() {
            $('.toast-container').fadeOut(function() {
                $(this).remove();
            });
        }, 3000);
    }
});