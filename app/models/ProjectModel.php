<?php
class ProjectModel {
    public function list($start=0,$length=10,$filters=[]){
        $titles = ["ระบบจะปิดปรับปรุงคืนนี้","ประกาศวันหยุดบริษัท","ย้ายสำนักงานใหม่","กิจกรรมปีใหม่ 2025","รายงานสรุปการขายไตรมาส 4"];
        $statuses = ["draft","published","scheduled"];
        $authors = ["Somchai","Anan","Somsak","Kittisak","Suchart"];
        $mock = [];
        for($i=1;$i<=50;$i++){
            $status = $statuses[array_rand($statuses)];
            $mock[] = [
                "id"=>$i,
                "title"=>$titles[array_rand($titles)]." #".$i,
                "cover_image"=>"https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSxgrd6iuhDTYxsdjR6Fg50ydpqqWCbPPVZ_w&s",
                "status"=>$status,
                "publish_at"=> $status==="scheduled" ? date("Y-m-d H:i:s", strtotime("+".rand(1,10)." days")) : date("Y-m-d H:i:s", strtotime("-".rand(1,10)." days")),
                "notify_users"=> rand(0,1),
                "view"=> rand(0,2000),
                "created_at"=> date("Y-m-d H:i:s", strtotime("-".rand(1,200)." days")),
                "create_by"=>$authors[array_rand($authors)]
            ];
        }
        $total = count($mock);
        $data = array_values(array_slice($mock,$start,$length));
        return ["total"=>$total,"data"=>$data];
    }
    public function get($id){
        return [
            "id"=>$id,
            "title"=>["th"=>"แจ้งปิดปรับปรุงระบบ","la"=>"ແຈ້ງການປິດປັບປຸງລະບົບ","en"=>"System Maintenance Notice"],
            "content"=>["th"=>"ระบบจะปิดปรับปรุงเวลา 22:00 - 02:00 น.","la"=>"ລະບົບຈະປິດປັບປຸງ 22:00 - 02:00","en"=>"The system will be under maintenance from 22:00 - 02:00."],
            "status"=>"scheduled",
            "publish_at"=>"2025-12-15 10:00:00",
            "notify_users"=>1,
            "cover_image"=>"uploads/project/cover_{$id}.jpg"
        ];
    }
}