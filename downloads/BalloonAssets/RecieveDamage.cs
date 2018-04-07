using System.Collections;
using System.Collections.Generic;
using UnityEngine;


public class RecieveDamage : MonoBehaviour {

    public virtual void Damage()
    {
        Debug.LogError(gameObject.name + "Has an undefined Damage() function.");

    }

}
