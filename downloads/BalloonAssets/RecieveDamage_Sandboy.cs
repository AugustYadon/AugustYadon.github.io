using System.Collections;
using System.Collections.Generic;
using UnityEngine;

public enum DamageZone { Head, Body, L_Arm, R_Arm, L_Leg, R_Leg }

public class RecieveDamage_Sandboy : RecieveDamage
{

    [SerializeField] DamageZone damage_zone;
    SandBoy sb;



    private void Start()
    {
        sb = transform.root.GetComponent<SandBoy>();
        if (sb == null) { Debug.Log("Sandboy Script not found from Damage script attached to: " + this.name); }

    }

    public override void Damage()
    {
        switch (damage_zone)
        {
            case DamageZone.Head:
                sb.Damage(66);
                //sb.Melt(,);
                sb.anim.SetTrigger("Headshot");
                return;
            case DamageZone.Body:
                sb.Damage(33);
                sb.anim.SetTrigger("Bodyshot");
                return;
            case DamageZone.L_Leg:
                sb.Damage(25);
                sb.anim.SetTrigger("Bodyshot");
                return;
            case DamageZone.R_Leg:
                sb.Damage(25);
                sb.anim.SetTrigger("Bodyshot");
                return;
            case DamageZone.L_Arm:
                sb.Damage(25);
                sb.anim.SetTrigger("Arm_L_shot");
                return;
            case DamageZone.R_Arm:
                sb.Damage(25);
                sb.anim.SetTrigger("Arm_R_shot");
                return;
            default:
                sb.Damage(33);
                sb.anim.SetTrigger("Bodyshot");
                return;
        }

    }

}
