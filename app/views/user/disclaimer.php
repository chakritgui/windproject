<?php
    if (empty($_SESSION['user'])) {
        header('Location: ' . BASE_URL . '/login');
        exit;
    }
    $disclaimer = $_SESSION['pending_disclaimer'] ?? null;
    $isReadOnly = isset($_SESSION['disclaimer_readonly']) ? $_SESSION['disclaimer_readonly'] : true;
    if (!$disclaimer) {
        header('Location: ' . BASE_URL . '/home');
        exit;
    }
?>
<link href="<?=BASE_URL?>/public/css/page.css?v=<?=time();?>" rel="stylesheet">
<link href="<?=BASE_URL?>/public/css/download.css?v=<?=time();?>" rel="stylesheet">
<div class="sky-wrap" id="skyWrap"></div>
<div class="container">  
    <div class="page">
        <div class="hero">
            <div class="wind-particles">
                <div class="particle pp-1"></div>
                <div class="particle pp-2"></div>
                <div class="particle pp-3"></div>
                <div class="particle pp-4"></div>
                <div class="particle pp-5"></div>
            </div>
            <div class="deco-cluster cluster-tl">
                <i class="fa-solid fa-sheet-plastic deco-1"></i>
                <i class="fa-solid fa-user-shield deco-2"></i>
            </div>
            <div class="deco-cluster cluster-br">
                <i class="fa-solid fa-building-shield deco-3"></i>
                <i class="fa-solid fa-file-circle-exclamation deco-4"></i>
                <i class="fa-solid fa-file-pen deco-5"></i>
            </div>
            <div class="hero-content">
                <div class="hero-icon">
                    <i class="fa-solid fa-file-shield text-white"></i>
                </div>
                <h1 data-i18n="disclaimer"></h1>
                <p><?php echo htmlspecialchars($disclaimer['title']) ?? '-'; ?></p>
                <div class="hero-accent"></div>
            </div>
        </div>
        <div class="install-container">
            <div class="install-card">
                <?php if (!empty($disclaimer['content'])): ?>
                    <div class="p-4">
                        <?php echo $disclaimer['content']; ?>
                    </div>
                <?php else: ?>
                    <div id="emptyState" class="empty-state animated fadeIn p-5 text-center">
                        <span class="empty-icon" style="font-size: 3rem;">📂</span>
                        <h3 data-i18n="no_items"></h3>
                        <p data-i18n="no_items_subtitle"></p>
                    </div>
                <?php endif; ?>
            </div>
        </div>
        <div class="mt-3 text-center p-4">
            <?php if (!$isReadOnly): ?>
                <div class="custom-control custom-checkbox mb-3">
                    <input type="checkbox" class="custom-control-input" id="checkAccept">
                    <label class="custom-control-label" for="checkAccept" data-i18n="i_have_read_and_agree"></label>
                </div>
                <div class="text-right">
                    <a href="<?=BASE_URL?>/logout" class="btn btn-secondary mr-2" data-i18n="logout"></a>
                    <button id="btnConfirm" class="btn btn-primary" disabled  data-id="<?=$disclaimer['id']?>" data-version="<?=$disclaimer['version']?>" data-i18n="confirm-and-continue"></button>
                </div>
            <?php else: ?>
            <?php endif; ?>
        </div>
    </div>
</div>
<script src="<?=BASE_URL?>/public/js/user/sky.js?v=<?=time();?>"></script>
<script>
    $(document).ready(function() {
        $('#checkAccept').on('change', function() {
            $('#btnConfirm').prop('disabled', !$(this).prop('checked'));
        });
        $('#btnConfirm').on('click', function() {
            const btn = $(this);
            const data = {
                disclaimer_id: btn.data('id'),
                version: btn.data('version')
            };
            btn.prop('disabled', true).html('<i class="fas fa-spinner fa-spin"></i> Processing...');
            $.post('<?php echo BASE_URL; ?>/api/accept-disclaimer', data, function(res) {
                if (res.status === 'success') {
                    window.location.href = '<?php echo BASE_URL; ?>/home';
                } else {
                    showError(langData['process_failed']);
                    btn.prop('disabled', false).text('Confirm and Continue');
                }
            }, 'json');
        });
    });
</script>