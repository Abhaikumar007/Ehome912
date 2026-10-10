const fs = require('fs');
const html = fs.readFileSync('C:/Users/madhu/code_test/private/master_hub.html', 'utf8');

const elementIds = [
    'edit_ann_id',
    'edit_ann_type',
    'edit_ann_class',
    'edit_ann_syllabus_stream',
    'edit_ann_subject',
    'edit_ann_title',
    'edit_ann_msg',
    'edit_ann_exam_section',
    'edit_ann_exam_date',
    'edit_ann_max_marks',
    'edit_ann_venue',
    'edit_ann_author',
    'edit_ann_syllabus',
    'edit_ann_instructions',
    'edit_ann_start_date',
    'edit_ann_end_date',
    'edit_ann_start_time',
    'edit_ann_end_time',
    'edit_ann_time_label',
    'edit_ann_icon',
    'edit_ann_important',
    'saveEditAnnBtn',
    'editAnnouncementForm',
    'editAnnouncementModal'
];

elementIds.forEach(id => {
    const present = html.includes(`id="${id}"`) || html.includes(`id='${id}'`);
    console.log(`${id}: ${present ? 'YES' : 'MISSING!'}`);
});
