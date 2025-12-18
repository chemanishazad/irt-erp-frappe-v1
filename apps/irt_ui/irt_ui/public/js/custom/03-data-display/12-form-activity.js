// Add a real "Activity" tab and pane inside form tabs
(function () {
    const LABEL = 'Activity';
    const PANE_ID = 'activity_tab';

    function get_tab_targets(frm) {
        const $w = $(frm.page.wrapper);
        const $tabs_list = $w
            .find('.form-tabs .nav, .form-tabs-list, .nav-tabs')
            .first();
        const $tab_content = $w.find('.tab-content').first();
        return { $tabs_list, $tab_content };
    }

    function create_activity_tab_if_missing(frm) {
        const { $tabs_list, $tab_content } = get_tab_targets(frm);
        if (!$tabs_list.length || !$tab_content.length) return false;

        // ---- Nav tab ----
        if (!$tabs_list.find(`[href="#${PANE_ID}"]`).length) {
            const $li = $('<li class="nav-item" data-custom-activity-tab="1"></li>');
            const $a = $(`
                <a class="nav-link"
                   href="#${PANE_ID}"
                   role="tab"
                   data-toggle="tab"
                   data-bs-toggle="tab">
                    ${LABEL}
                </a>
            `);
            $li.append($a);
            $tabs_list.append($li);
        }

        // ---- Pane ----
        if (!$tab_content.find(`#${PANE_ID}`).length) {
            const $pane = $(`
                <div class="tab-pane fade form-tab-content"
                     id="${PANE_ID}"
                     role="tabpanel"
                     style="padding: var(--padding-lg)">
                    <div class="activity-timeline-wrapper text-muted">
                        Loading activity…
                    </div>
                </div>
            `);
            $tab_content.append($pane);
        }

        // ---- Bind activation once ----
        const $link = $tabs_list.find(`[href="#${PANE_ID}"]`);
        if (!$link.data('activity-bound')) {
            $link
                .data('activity-bound', 1)
                .on('click', function (e) {
                    e.preventDefault();
                    activate_activity_tab(frm);
                });
        }

        return true;
    }

    function activate_activity_tab(frm) {
        const { $tabs_list, $tab_content } = get_tab_targets(frm);
        const $pane = $tab_content.find(`#${PANE_ID}`);
        const $link = $tabs_list.find(`[href="#${PANE_ID}"]`);

        // Activate nav
        $tabs_list.find('.nav-link').removeClass('active');
        $link.addClass('active');

        // Activate pane
        $tab_content.children('.tab-pane').removeClass('active show');
        $pane.addClass('active show');

        // Render activity if needed
        const $wrapper = $pane.find('.activity-timeline-wrapper');
        if ($wrapper.data('loaded-for') !== frm.doc.name) {
            render_activity(frm, $wrapper);
        }
    }

    function render_activity(frm, $container) {
        const doc = frm.doc;
        if (!doc || !doc.doctype || !doc.name) {
            $container.text('No document loaded.');
            return;
        }

        $container.text('Loading activity…');

        // ---- Preferred: Frappe Timeline ----
        try {
            if (
                frappe.ui &&
                frappe.ui.form &&
                frappe.ui.form.Timeline
            ) {
                $container.empty();
                const timeline = new frappe.ui.form.Timeline({
                    parent: $container[0],
                    frm: frm
                });
                timeline.refresh();
                $container.data('loaded-for', doc.name);
                return;
            }
        } catch (e) {
            // fallback below
        }

        // ---- Fallback: Communications ----
        frappe.call({
            method: 'frappe.desk.form.load.get_communications',
            args: {
                doctype: doc.doctype,
                name: doc.name
            },
            callback: (r) => {
                const comms = (r && r.message) || [];
                if (!comms.length) {
                    $container.text('No activity yet.');
                    return;
                }

                const $list = $('<div class="activity-items"></div>');
                comms.forEach(c => {
                    const who = frappe.utils.escape_html(
                        c.sender_full_name || c.sender || 'System'
                    );
                    const when = frappe.datetime
                        ? frappe.datetime.prettyDate(c.creation)
                        : c.creation;
                    const subject = frappe.utils.escape_html(
                        c.subject || c.communication_type || ''
                    );

                    const $item = $(`
                        <div class="activity-item"
                             style="padding: var(--padding-md) 0;
                                    border-bottom: 1px solid var(--border-color)">
                            <div class="text-muted" style="font-size:12px">
                                ${when}
                            </div>
                            <div style="font-weight:600">
                                ${subject}
                            </div>
                            <div style="color:var(--text-color)">
                                ${c.content || ''}
                            </div>
                            <div class="text-muted" style="font-size:12px">
                                by ${who}
                            </div>
                        </div>
                    `);
                    $list.append($item);
                });

                $container.empty()
                    .append($list)
                    .data('loaded-for', doc.name);
            },
            error: () => {
                $container.text('Could not load activity.');
            }
        });
    }

    // ---- Attach to all doctypes ----
    frappe.ui.form.on('*', {
        refresh(frm) {
            // Delay until tabs are rendered
            setTimeout(() => {
                if (create_activity_tab_if_missing(frm)) {
                    if ((window.location.hash || '').includes(PANE_ID)) {
                        activate_activity_tab(frm);
                    }
                }
            }, 100);
        }
    });
})();
